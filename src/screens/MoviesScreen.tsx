import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { GlassCard } from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";
import { MovieService } from "../api/movieService";
import { Movie, SwipeType } from "../types/movies";
import { COLORS, FONTS, SPACING, SHADOWS, GRADIENTS, OPACITY } from "../constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

export const MoviesScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, activeCouple } = useAuth();

  // Navigation tabs: 'swipe' | 'matches'
  const [activeTab, setActiveTab] = useState<"swipe" | "matches">("swipe");

  // State
  const [movies, setMovies] = useState<Movie[]>([]);
  const [swipes, setSwipes] = useState<Record<string, SwipeType>>({});
  const [matches, setMatches] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateNightMode, setDateNightMode] = useState(false);

  // Match Modal State
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const nextCardScale = useRef(new Animated.Value(0.9)).current;
  const nextCardTranslateY = useRef(new Animated.Value(10)).current;

  // Index of the current movie in the list
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load movies, swipes, and matches
  const loadData = async () => {
    try {
      setLoading(true);
      const allMovies = await MovieService.getMovies();
      setMovies(allMovies);

      if (activeCouple && user) {
        // Load swipes for this user
        const coupleSwipes = await MovieService.getSwipesForCouple(activeCouple.id);
        const userSwipesMap: Record<string, SwipeType> = {};
        coupleSwipes.forEach((s) => {
          if (s.user_id === user.id) {
            userSwipesMap[s.movie_id] = s.swipe_type;
          }
        });
        setSwipes(userSwipesMap);

        // Load matches
        const matchedIds = await MovieService.getMatches(activeCouple.id);
        const matchedMovies = allMovies.filter((m) => matchedIds.includes(m.id));
        setMatches(matchedMovies);

        // Find first unswiped movie index
        const firstUnswiped = allMovies.findIndex((m) => !userSwipesMap[m.id]);
        setCurrentIndex(firstUnswiped !== -1 ? firstUnswiped : allMovies.length);
      } else {
        // Solo mode: no swipes or matches saved in DB, use local state
        setSwipes({});
        setMatches([]);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Failed to load movie data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCouple, user]);

  // Movies filtered by Date Night Mode (e.g. filter to Romance genre if active)
  const filteredMovies = useMemo(() => {
    if (!dateNightMode) return movies;
    return movies.filter(
      (m) =>
        m.genre.toLowerCase().includes("romance") ||
        m.genre.toLowerCase().includes("comedy")
    );
  }, [movies, dateNightMode]);

  // Adjust current index when filtered list changes
  useEffect(() => {
    if (filteredMovies.length > 0) {
      const firstUnswiped = filteredMovies.findIndex((m) => !swipes[m.id]);
      setCurrentIndex(firstUnswiped !== -1 ? firstUnswiped : filteredMovies.length);
    } else {
      setCurrentIndex(0);
    }
  }, [filteredMovies, swipes]);

  const currentMovie = filteredMovies[currentIndex];
  const nextMovie = filteredMovies[currentIndex + 1];

  // Pan Responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Animate next card to scale up as we drag active card
        const dragDistance = Math.min(Math.abs(gestureState.dx), SWIPE_THRESHOLD);
        const ratio = dragDistance / SWIPE_THRESHOLD;
        nextCardScale.setValue(0.9 + ratio * 0.1);
        nextCardTranslateY.setValue(10 - ratio * 10);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeCard("right");
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeCard("left");
        } else {
          // Reset
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              friction: 4,
            }),
            Animated.spring(nextCardScale, {
              toValue: 0.9,
              useNativeDriver: false,
            }),
            Animated.spring(nextCardTranslateY, {
              toValue: 10,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Handle Swipe
  const swipeCard = (direction: "left" | "right" | "up") => {
    const toValueX = direction === "right" ? SCREEN_WIDTH + 100 : direction === "left" ? -SCREEN_WIDTH - 100 : 0;
    const toValueY = direction === "up" ? -SCREEN_WIDTH - 300 : 0;

    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: toValueX, y: toValueY },
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(nextCardTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Record Swipe in Database
      const swipeType: SwipeType = direction === "right" ? "like" : direction === "left" ? "dislike" : "super_like";
      handleSwipeRegistered(currentMovie, swipeType);
    });
  };

  const handleSwipeRegistered = async (movie: Movie, swipeType: SwipeType) => {
    if (!movie) return;

    // Local update
    setSwipes((prev) => ({ ...prev, [movie.id]: swipeType }));
    pan.setValue({ x: 0, y: 0 });
    nextCardScale.setValue(0.9);
    nextCardTranslateY.setValue(10);
    setCurrentIndex((prev) => prev + 1);

    if (activeCouple && user) {
      try {
        await MovieService.swipeMovie(user.id, activeCouple.id, movie.id, swipeType);

        // If swipe was positive, check if partner also liked it (meaning a match!)
        if (swipeType === "like" || swipeType === "super_like") {
          const coupleSwipes = await MovieService.getSwipesForCouple(activeCouple.id);
          const partnerId = activeCouple.partner.id;
          const partnerSwipe = coupleSwipes.find(
            (s) => s.movie_id === movie.id && s.user_id === partnerId
          );

          if (partnerSwipe && (partnerSwipe.swipe_type === "like" || partnerSwipe.swipe_type === "super_like")) {
            // It's a match!
            setMatchedMovie(movie);
            setMatchModalVisible(true);
            setMatches((prev) => [...prev, movie]);
          }
        }
      } catch (err) {
        console.error("Failed to save swipe to database:", err);
      }
    }
  };

  // Reset Swipes for Demo Purposes
  const resetSwipes = async () => {
    if (activeCouple && user) {
      try {
        setLoading(true);
        // In real app we might delete row in supabase, here we can just clear in local
        // Or if you want a complete reset we can run a delete query on movie_swipes for this user
        const { error } = await supabase
          .from("movie_swipes")
          .delete()
          .eq("user_id", user.id);

        if (error) throw error;
        await loadData();
      } catch (err) {
        console.error("Failed to reset swipes:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setSwipes({});
      setCurrentIndex(0);
    }
  };

  // Movie Card Visual Styles
  const cardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      {
        rotate: pan.x.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: ["-10deg", "0deg", "10deg"],
        }),
      },
    ],
  };

  // Render Swipe Deck Tab
  const renderSwipeDeck = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      );
    }

    if (currentIndex >= filteredMovies.length) {
      return (
        <View style={styles.centerContainer}>
          <GlassCard style={styles.emptyCard} opacity={OPACITY.glass}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyTitle}>You're All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              You've swiped on all available movies. Wait for your partner to catch up or start over!
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetSwipes}>
              <Text style={styles.resetButtonText}>Reset Swipes</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      );
    }

    return (
      <View style={styles.deckContainer}>
        {/* Next Card underneath (Preview) */}
        {nextMovie && (
          <Animated.View
            style={[
              styles.cardContainer,
              styles.nextCard,
              {
                transform: [{ scale: nextCardScale }, { translateY: nextCardTranslateY }],
              },
            ]}
          >
            <View style={styles.cardWrapper}>
              {nextMovie.poster_url ? (
                <Image source={{ uri: nextMovie.poster_url }} style={styles.posterImage} />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <MaterialIcons name="movie" size={60} color={COLORS.textTertiary} />
                </View>
              )}
              <View style={styles.previewCardOverlay} />
            </View>
          </Animated.View>
        )}

        {/* Active Card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.cardContainer, cardStyle]}
        >
          <View style={styles.cardWrapper}>
            {currentMovie.poster_url ? (
              <Image source={{ uri: currentMovie.poster_url }} style={styles.posterImage} />
            ) : (
              <View style={styles.posterPlaceholder}>
                <MaterialIcons name="movie" size={60} color={COLORS.textTertiary} />
              </View>
            )}

            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
              colors={["transparent", "rgba(74, 21, 75, 0.9)"]}
              style={styles.gradientOverlay}
            />

            {/* Movie Info Overlay */}
            <View style={styles.infoOverlay}>
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <MaterialIcons name="theater-comedy" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.tagText}>{currentMovie.genre}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{currentMovie.year}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{currentMovie.duration}</Text>
                </View>
              </View>

              <Text style={styles.movieTitle}>{currentMovie.title}</Text>
              <Text style={styles.movieDescription} numberOfLines={3}>
                {currentMovie.description}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Swipe Control Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, styles.dislikeButton]}
            onPress={() => swipeCard("left")}
            activeOpacity={0.8}
          >
            <MaterialIcons name="close" size={32} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.superLikeButton]}
            onPress={() => swipeCard("up")}
            activeOpacity={0.8}
          >
            <MaterialIcons name="star" size={24} color={COLORS.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.likeButton]}
            onPress={() => swipeCard("right")}
            activeOpacity={0.8}
          >
            <MaterialIcons name="favorite" size={32} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Match List Item
  const renderMatchItem = ({ item }: { item: Movie }) => (
    <GlassCard style={styles.matchItemCard} opacity={OPACITY.glass}>
      <View style={styles.matchItemRow}>
        {item.poster_url ? (
          <Image source={{ uri: item.poster_url }} style={styles.matchItemPoster} />
        ) : (
          <View style={styles.matchItemPlaceholder}>
            <MaterialIcons name="movie" size={24} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={styles.matchItemDetails}>
          <Text style={styles.matchItemTitle}>{item.title}</Text>
          <Text style={styles.matchItemSub}>{item.genre} • {item.year}</Text>
          <Text style={styles.matchItemDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>
    </GlassCard>
  );

  // Render Matches Tab
  const renderMatchesList = () => {
    if (matches.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <GlassCard style={styles.emptyCard} opacity={OPACITY.glass}>
            <Text style={styles.emptyIcon}>🍿</Text>
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptySubtitle}>
              Keep swiping! When both you and your partner swipe right on a movie, it will appear here.
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={() => setActiveTab("swipe")}>
              <Text style={styles.resetButtonText}>Start Swiping</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      );
    }

    return (
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        contentContainerStyle={styles.matchesListContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Top Header App Bar */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Movie Match</Text>

          {/* Date Night Mode Switch */}
          <TouchableOpacity
            style={[styles.dateNightToggle, dateNightMode && styles.dateNightToggleActive]}
            onPress={() => setDateNightMode(!dateNightMode)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="nightlight-round"
              size={18}
              color={dateNightMode ? COLORS.accent : COLORS.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.dateNightToggleText, dateNightMode && styles.dateNightToggleTextActive]}>
              Date Night
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Buttons (Swipe / Matches) */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "swipe" && styles.tabButtonActive]}
            onPress={() => setActiveTab("swipe")}
          >
            <Text style={[styles.tabButtonText, activeTab === "swipe" && styles.tabButtonTextActive]}>
              Swipe Deck
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "matches" && styles.tabButtonActive]}
            onPress={() => setActiveTab("matches")}
          >
            <Text style={[styles.tabButtonText, activeTab === "matches" && styles.tabButtonTextActive]}>
              Matches ({matches.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === "swipe" ? renderSwipeDeck() : renderMatchesList()}
      </View>

      {/* It's a Match! Overlay Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={matchModalVisible}
        onRequestClose={() => setMatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} opacity={0.95}>
            <Text style={styles.modalEmoji}>🍿🎉</Text>
            <Text style={styles.modalTitle}>It's a Match!</Text>
            <Text style={styles.modalSubtitle}>
              You and {activeCouple?.partner.first_name || "your partner"} both want to watch:
            </Text>
            
            {matchedMovie && (
              <View style={styles.matchedMovieCard}>
                {matchedMovie.poster_url ? (
                  <Image source={{ uri: matchedMovie.poster_url }} style={styles.matchedMoviePoster} />
                ) : (
                  <View style={styles.matchedMoviePlaceholder}>
                    <MaterialIcons name="movie" size={32} color={COLORS.textTertiary} />
                  </View>
                )}
                <View style={styles.matchedMovieInfo}>
                  <Text style={styles.matchedMovieTitle}>{matchedMovie.title}</Text>
                  <Text style={styles.matchedMovieSub}>{matchedMovie.genre} • {matchedMovie.year}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalKeepSwipingButton}
              onPress={() => setMatchModalVisible(false)}
            >
              <Text style={styles.modalKeepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalViewMatchesButton}
              onPress={() => {
                setMatchModalVisible(false);
                setActiveTab("matches");
              }}
            >
              <Text style={styles.modalViewMatchesText}>View All Matches</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

// Import Supabase directly to help with clear/reset swipes
import { supabase } from "../lib/supabase";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: "rgba(253, 249, 240, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 26,
    color: COLORS.secondary,
  },
  dateNightToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dateNightToggleActive: {
    backgroundColor: COLORS.secondary,
  },
  dateNightToggleText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateNightToggleTextActive: {
    color: "#ffffff",
  },
  tabBar: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 9999,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9999,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
    ...SHADOWS.light,
  },
  tabButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: "center",
    width: "100%",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  deckContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  cardContainer: {
    width: "100%",
    height: "75%",
    maxWidth: 360,
    maxHeight: 520,
    position: "absolute",
    borderRadius: 24,
    ...SHADOWS.medium,
  },
  nextCard: {
    zIndex: -1,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceContainer,
  },
  posterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  posterPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
  },
  previewCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(253, 249, 240, 0.4)",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#ffffff",
  },
  movieTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 28,
    color: "#ffffff",
    marginBottom: 6,
  },
  movieDescription: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: SPACING.sm,
    width: "100%",
    gap: SPACING.lg,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },
  dislikeButton: {
    backgroundColor: COLORS.surfaceContainer,
  },
  superLikeButton: {
    backgroundColor: COLORS.surfaceContainer,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeButton: {
    backgroundColor: COLORS.primary,
  },
  matchesListContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  matchItemCard: {
    marginBottom: SPACING.md,
    borderRadius: 16,
    overflow: "hidden",
  },
  matchItemRow: {
    flexDirection: "row",
    padding: SPACING.md,
  },
  matchItemPoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  matchItemPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  matchItemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  matchItemTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  matchItemSub: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  matchItemDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(28, 28, 23, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalCard: {
    width: "90%",
    padding: SPACING.xl,
    alignItems: "center",
    borderRadius: 24,
  },
  modalEmoji: {
    fontSize: 50,
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 28,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  matchedMovieCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 16,
    padding: SPACING.md,
    width: "100%",
    alignItems: "center",
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  matchedMoviePoster: {
    width: 50,
    height: 75,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  matchedMoviePlaceholder: {
    width: 50,
    height: 75,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  matchedMovieInfo: {
    flex: 1,
  },
  matchedMovieTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  matchedMovieSub: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalKeepSwipingButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalKeepSwipingText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  modalViewMatchesButton: {
    width: "100%",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalViewMatchesText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});
