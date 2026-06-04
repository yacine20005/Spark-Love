import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";
import { JournalService } from "../api/journalService";
import { JournalEntry, JournalEntryType } from "../types/journal";
import { COLORS, FONTS, SPACING, SHADOWS, GRADIENTS, OPACITY } from "../constants";

// Predefined beautiful illustrations for memories
const PRESETS = [
  {
    id: "dinner",
    label: "🍝 Cozy Dinner",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
  },
  {
    id: "beach",
    label: "🌅 Sunset Walk",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500",
  },
  {
    id: "coffee",
    label: "☕ Coffee Date",
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500",
  },
];

export const JournalScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, activeCouple } = useAuth();

  // State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New entry form state
  const [entryType, setEntryType] = useState<JournalEntryType>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(PRESETS[0].url);

  // Load journal entries
  const loadEntries = async () => {
    if (!activeCouple) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await JournalService.getJournalEntries(activeCouple.id);
      setEntries(data);
    } catch (error) {
      console.error("Failed to load journal entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [activeCouple]);

  const handleSubmit = async () => {
    if (!activeCouple || !user || !content.trim()) return;

    try {
      setSubmitting(true);
      const newEntry = await JournalService.createJournalEntry(
        activeCouple.id,
        user.id,
        entryType,
        title.trim() || null,
        content.trim(),
        entryType === "memory" ? selectedPhotoUrl : null
      );

      // Add new entry to top of feed
      setEntries((prev) => [newEntry, ...prev]);

      // Reset form & close modal
      setTitle("");
      setContent("");
      setSelectedPhotoUrl(PRESETS[0].url);
      setEntryType("note");
      setModalVisible(false);
    } catch (err) {
      console.error("Error creating entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      return "Just now";
    }
  };

  const renderEntry = (entry: JournalEntry) => {
    const isOwner = entry.user_id === user?.id;
    const authorName = isOwner
      ? "You"
      : entry.profiles?.first_name || activeCouple?.partner.first_name || "Partner";

    switch (entry.entry_type) {
      case "note":
        return (
          <GlassCard key={entry.id} style={styles.entryCardNote} opacity={OPACITY.glass}>
            <View style={styles.entryHeader}>
              <View style={styles.tagNote}>
                <MaterialIcons name="edit-note" size={14} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                <Text style={styles.tagNoteText}>Note</Text>
              </View>
              <Text style={styles.entryTime}>{formatDate(entry.created_at)}</Text>
            </View>
            <View style={styles.noteContentWrapper}>
              <Text style={styles.noteContentText}>"{entry.content}"</Text>
              <Text style={styles.noteAuthorText}>- {authorName}</Text>
            </View>
          </GlassCard>
        );

      case "memory":
        return (
          <GlassCard key={entry.id} style={styles.entryCardMemory} opacity={OPACITY.glass}>
            <View style={styles.entryHeader}>
              <View style={styles.tagMemory}>
                <MaterialIcons name="photo-camera" size={14} color={COLORS.tertiary} style={{ marginRight: 4 }} />
                <Text style={styles.tagMemoryText}>Memory</Text>
              </View>
              <Text style={styles.entryTime}>{formatDate(entry.created_at)}</Text>
            </View>

            {entry.image_url && (
              <View style={styles.memoryImageContainer}>
                <Image source={{ uri: entry.image_url }} style={styles.memoryImage} />
              </View>
            )}

            <View style={styles.memoryDetails}>
              <Text style={styles.memoryAuthorText}>{authorName}</Text>
              <Text style={styles.memoryContentText}>{entry.content}</Text>
            </View>
          </GlassCard>
        );

      case "sync":
        return (
          <GlassCard key={entry.id} style={styles.entryCardSync} opacity={OPACITY.glass}>
            <View style={styles.entryHeader}>
              <View style={styles.tagSync}>
                <MaterialIcons name="sync" size={14} color={COLORS.secondary} style={{ marginRight: 4 }} />
                <Text style={styles.tagSyncText}>Daily Sync</Text>
              </View>
              <Text style={styles.entryTime}>{formatDate(entry.created_at)}</Text>
            </View>
            <Text style={styles.syncQuestionTitle}>{entry.title || "Daily Question"}</Text>
            <Text style={styles.syncAnswerText}>{entry.content}</Text>
          </GlassCard>
        );

      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!activeCouple) {
      return (
        <View style={styles.centerContainer}>
          <GlassCard style={styles.emptyCard} opacity={OPACITY.glass}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>Journal Locked</Text>
            <Text style={styles.emptySubtitle}>
              Please link a partner in your profile settings to access the shared Couple's Journal.
            </Text>
          </GlassCard>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Opening journal...</Text>
        </View>
      );
    }

    if (entries.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <GlassCard style={styles.emptyCard} opacity={OPACITY.glass}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>Our First Page</Text>
            <Text style={styles.emptySubtitle}>
              This is a private space for just the two of you. Write your first note or post a special photo memory!
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.createFirstButtonText}>Write First Entry</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro banner */}
        <View style={styles.introContainer}>
          <Text style={styles.pageTitle}>Our Journal</Text>
          <Text style={styles.pageSubtitle}>
            A private archive of your shared memories and connection questions.
          </Text>
        </View>

        {/* List of Entries */}
        <View style={styles.feedContainer}>
          {entries.map(renderEntry)}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Content Area */}
      <View style={[styles.main, { paddingTop: insets.top }]}>
        {renderContent()}
      </View>

      {/* Floating Action Button (FAB) */}
      {activeCouple && !loading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.fabGradient}
          >
            <MaterialIcons name="add" size={30} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Write New Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard
            style={styles.modalCard}
            opacity={0.98}
            gradient={["#ffffff", "#fcf9f2"]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, entryType === "note" && styles.typeButtonActive]}
                onPress={() => setEntryType("note")}
              >
                <MaterialIcons name="edit-note" size={20} color={entryType === "note" ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.typeButtonText, entryType === "note" && styles.typeButtonTextActive]}>
                  Text Note
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeButton, entryType === "memory" && styles.typeButtonActive]}
                onPress={() => setEntryType("memory")}
              >
                <MaterialIcons name="photo-camera" size={18} color={entryType === "memory" ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.typeButtonText, entryType === "memory" && styles.typeButtonTextActive]}>
                  Photo Memory
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Input Form */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              
              {entryType === "memory" && (
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Select Photo</Text>
                  <View style={styles.photoPresetsRow}>
                    {PRESETS.map((p) => {
                      const isSelected = selectedPhotoUrl === p.url;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[
                            styles.photoPresetCard,
                            isSelected && styles.photoPresetCardSelected,
                          ]}
                          onPress={() => setSelectedPhotoUrl(p.url)}
                        >
                          <Image source={{ uri: p.url }} style={styles.presetImage} />
                          <Text style={styles.presetLabel} numberOfLines={1}>
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>
                  {entryType === "note" ? "What's on your mind?" : "Describe this memory..."}
                </Text>
                <TextInput
                  style={styles.contentInput}
                  placeholder={
                    entryType === "note"
                      ? "Write a sweet note or thought for your partner..."
                      : "We had the best time at..."
                  }
                  placeholderTextColor={COLORS.textTertiary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={5}
                />
              </View>

              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
              ) : (
                <TouchableOpacity
                  style={[styles.submitButton, !content.trim() && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!content.trim()}
                >
                  <Text style={styles.submitButtonText}>
                    {entryType === "note" ? "Post Note" : "Post Memory"}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  main: {
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
  createFirstButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createFirstButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl + 40,
  },
  introContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 32,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  feedContainer: {
    gap: SPACING.lg,
  },
  entryCardNote: {
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  entryCardMemory: {
    padding: SPACING.md,
    borderRadius: 16,
  },
  entryCardSync: {
    padding: SPACING.md,
    borderRadius: 16,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  entryTime: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  tagNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagNoteText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  tagMemory: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(156, 65, 67, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(156, 65, 67, 0.2)",
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagMemoryText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: COLORS.tertiary,
  },
  tagSync: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(132, 73, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(132, 73, 129, 0.2)",
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagSyncText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: COLORS.secondary,
  },
  noteContentWrapper: {
    paddingVertical: SPACING.xs,
  },
  noteContentText: {
    fontFamily: "PlusJakartaSans_500Medium_Italic",
    fontSize: 18,
    color: COLORS.textPrimary,
    lineHeight: 26,
    fontStyle: "italic",
  },
  noteAuthorText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: SPACING.sm,
  },
  memoryImageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: SPACING.md,
  },
  memoryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  memoryDetails: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "flex-start",
  },
  memoryAuthorText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: COLORS.textPrimary,
    minWidth: 50,
  },
  memoryContentText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  syncQuestionTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  syncAnswerText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.xl + 10,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...SHADOWS.medium,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
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
    maxHeight: "80%",
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
  typeSelector: {
    flexDirection: "row",
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    padding: 3,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: "#ffffff",
    ...SHADOWS.light,
  },
  typeButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: COLORS.primary,
  },
  formContainer: {
    width: "100%",
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  contentInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 16,
    padding: SPACING.md,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
  },
  photoPresetsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: 4,
  },
  photoPresetCard: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: COLORS.surfaceContainer,
  },
  photoPresetCardSelected: {
    borderColor: COLORS.primary,
  },
  presetImage: {
    width: "100%",
    height: 60,
    resizeMode: "cover",
  },
  presetLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: COLORS.textPrimary,
    textAlign: "center",
    paddingVertical: 4,
  },
  submitButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
});
