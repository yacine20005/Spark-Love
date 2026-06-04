import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  Modal,
  Alert,
} from "react-native";
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS, SIZES, SHADOWS } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../components/GlassCard";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { useQuiz } from "../context/QuizContext";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { user, profile, activeCouple, signOut } = useAuth();
  const { progress, categories } = useQuiz();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // 1. Calculate Days of Love
  const getDaysOfLove = () => {
    if (!activeCouple?.created_at) return null;
    const created = new Date(activeCouple.created_at).getTime();
    const now = new Date().getTime();
    const diff = now - created;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const daysOfLove = getDaysOfLove();

  // 2. Fetch Couple Initials
  const getInitials = () => {
    const myInitial = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : "";
    const partnerInitial = activeCouple?.partner?.first_name ? activeCouple.partner.first_name.charAt(0).toUpperCase() : "";
    
    if (myInitial && partnerInitial) {
      return `${myInitial} & ${partnerInitial}`;
    }
    return myInitial || "S";
  };

  // 3. Greeting names
  const myName = profile?.first_name || "You";
  const partnerName = activeCouple?.partner?.first_name || "";
  const coupleGreeting = partnerName ? `${myName} & ${partnerName}` : myName;

  // 4. Dynamic Quiz Progress for Bento Left Card
  const getQuizProgress = () => {
    if (!progress || progress.length === 0) {
      return {
        categoryName: "Love Languages",
        subtitle: "Start your first quiz",
        pct: 0,
      };
    }
    // Use the first category in progress
    const activeProgress = progress[0];
    const categoryName = activeProgress.category_name;
    const answered = activeProgress.questions_answered;
    const total = activeProgress.total_questions;
    const pct = total > 0 ? (answered / total) * 100 : 0;
    
    return {
      categoryName,
      subtitle: answered === total ? "Quiz completed" : `${answered}/${total} answered`,
      pct,
    };
  };

  const quizProgress = getQuizProgress();

  // 5. Get Daily Question
  const getDailyQuestionText = () => {
    if (!categories || categories.length === 0) {
      return "What is a small moment from this week that made you smile?";
    }
    // Find the first active question based on overall progress
    for (const cat of categories) {
      const catProgress = progress.find(p => p.category_id === cat.id);
      const answered = catProgress?.questions_answered || 0;
      if (cat.questions && cat.questions.length > answered) {
        return cat.questions[answered].text;
      }
    }
    return categories[0]?.questions?.[0]?.text || "What is a small moment from this week that made you smile?";
  };

  const dailyQuestion = getDailyQuestionText();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.profileBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileBadgeText}>{getInitials()}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.appTitle}>Spark Love</Text>

        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="favorite" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greetings & Days of Love Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Good morning,{"\n"}{coupleGreeting}</Text>
          <View style={styles.daysBadge}>
            <MaterialIcons name="alarm" size={16} color={COLORS.textSecondary} />
            <Text style={styles.daysBadgeText}>
              {daysOfLove !== null ? `${daysOfLove} days of love` : "Solo Mode"}
            </Text>
          </View>
        </View>

        {/* Daily Spark Card */}
        <GlassCard style={styles.dailyCard} opacity={OPACITY.glass}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.sparkTag}>
              <MaterialIcons name="whatshot" size={14} color="#ffffff" />
              <Text style={styles.sparkTagText}>Daily Spark</Text>
            </View>
          </View>

          <Text style={styles.dailyQuestion}>{dailyQuestion}</Text>

          {partnerName ? (
            <>
              <Text style={styles.dailySubtext}>Take a moment to share a quick memory with {partnerName}.</Text>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() => navigation.navigate("Quiz")}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.answerButtonText}>Answer Together</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.dailySubtext}>Connect with your partner to share responses and answer daily quizzes together.</Text>
              <TouchableOpacity
                style={styles.answerButton}
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.8}
              >
                <MaterialIcons name="link" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.answerButtonText}>Link Partner</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        {/* Bento Grid */}
        <View style={styles.bentoContainer}>
          {/* Left Card: Progress Card */}
          <GlassCard style={styles.bentoLeftCard} opacity={OPACITY.glass}>
            <View style={styles.quizIconCircle}>
              <MaterialIcons name="quiz" size={20} color={COLORS.secondary} />
            </View>
            <View style={styles.quizInfoContainer}>
              <Text
                style={styles.bentoCardTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {quizProgress.categoryName}
              </Text>
              <Text style={styles.bentoCardSubtitle}>{quizProgress.subtitle}</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${Math.max(10, quizProgress.pct)}%` }]} />
            </View>
          </GlassCard>

          {/* Right Card: Memory Card */}
          <TouchableOpacity
            style={styles.bentoRightCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("Journal")}
          >
            <ImageBackground
              source={require("../../assets/cafe_memory.png")}
              style={styles.backgroundImage}
              imageStyle={styles.backgroundImageStyle}
            >
              <View style={styles.cardOverlay} />
              <View style={styles.memoryIconCircle}>
                <MaterialIcons name="photo-library" size={18} color={COLORS.textPrimary} />
              </View>
              <View>
                <Text style={styles.memoryTitle}>Sunday Walk</Text>
                <Text style={styles.memorySubtitle}>Added 2 days ago</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Movie Teaser Card */}
        <TouchableOpacity
          style={styles.movieTeaserCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate("Movies")}
        >
          <ImageBackground
            source={require("../../assets/cinema_teaser.png")}
            style={styles.backgroundImage}
            imageStyle={styles.backgroundImageStyle}
          >
            <View style={styles.cardGradientOverlay} />
            <View style={styles.movieContentContainer}>
              <View style={styles.movieTag}>
                <MaterialIcons name="movie" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.movieTagText}>Ready to Match</Text>
              </View>
              <Text style={styles.movieTitle}>Movie Night Setup</Text>
              <Text style={styles.movieSubtitle}>Swipe together to find your next watch.</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </ScrollView>

      {/* Settings Glass Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={settingsVisible}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <GlassCard
            style={styles.modalCard}
            opacity={0.98}
            gradient={["#ffffff", "#fcf9f2"]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalSectionLabel}>Profile Details</Text>
              <Text style={styles.modalInfoText}>Name: {profile?.first_name} {profile?.last_name}</Text>
              <Text style={styles.modalInfoText}>Email: {user?.email}</Text>

              <View style={styles.modalDivider} />

              <Text style={styles.modalSectionLabel}>Couple Status</Text>
              {partnerName ? (
                <View style={styles.coupleStatusConnected}>
                  <MaterialIcons name="check-circle" size={18} color="#2ecc71" style={{ marginRight: 6 }} />
                  <Text style={styles.coupleStatusText}>Connected to {partnerName}</Text>
                </View>
              ) : (
                <View style={styles.coupleStatusDisconnected}>
                  <MaterialIcons name="warning" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.coupleStatusText}>Solo Mode (No partner linked)</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalSettingsButton}
                onPress={() => {
                  setSettingsVisible(false);
                  navigation.navigate("Profile");
                }}
              >
                <Text style={styles.modalSettingsButtonText}>Edit Profile & Link Partner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={() => {
                  setSettingsVisible(false);
                  signOut();
                }}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassDark,
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileBadgeGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    color: "#ffffff",
  },
  appTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 22,
    color: COLORS.primary,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.glass,
  },
  welcomeSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 32,
    color: COLORS.textPrimary,
    lineHeight: 38,
  },
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    marginTop: SPACING.sm,
  },
  daysBadgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  dailyCard: {
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 24,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sparkTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  sparkTagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#ffffff",
    marginLeft: 4,
  },
  dailyQuestion: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 22,
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: SPACING.sm,
  },
  dailySubtext: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  answerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 9999,
    ...SHADOWS.light,
  },
  answerButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  bentoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  bentoLeftCard: {
    width: "48%",
    height: 170,
    padding: SPACING.md,
    justifyContent: "space-between",
    borderRadius: 24,
  },
  quizIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  quizInfoContainer: {
    marginTop: SPACING.sm,
  },
  bentoCardTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  bentoCardSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressBarBackground: {
    width: "100%",
    height: 6,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  bentoRightCard: {
    width: "48%",
    height: 170,
    borderRadius: 24,
    overflow: "hidden",
    ...SHADOWS.light,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  backgroundImageStyle: {
    borderRadius: 24,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(28, 28, 23, 0.25)",
    borderRadius: 24,
  },
  memoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  memoryTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  memorySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  movieTeaserCard: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.light,
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(28, 28, 23, 0.4)",
    borderRadius: 24,
  },
  movieContentContainer: {
    justifyContent: "flex-end",
    flex: 1,
  },
  movieTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    marginBottom: SPACING.sm,
  },
  movieTagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#ffffff",
  },
  movieTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 22,
    color: "#ffffff",
    marginBottom: 4,
  },
  movieSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 23, 0.4)",
  },
  modalCard: {
    width: "85%",
    padding: SPACING.lg,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    width: "100%",
  },
  modalSectionLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  modalInfoText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.glassDark,
    marginVertical: SPACING.md,
  },
  coupleStatusConnected: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  coupleStatusDisconnected: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  coupleStatusText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalSettingsButton: {
    width: "100%",
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalSettingsButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  signOutButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
  },
  signOutButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
});
