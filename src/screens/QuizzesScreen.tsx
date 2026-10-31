import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { fetchCategories, fetchProgress } from "../api/quiz";
import { useHousehold } from "../context/session";
import { useLoader } from "../lib/useLoader";
import type { TabProps } from "../navigation/types";
import { ErrorState, makeStyles, useTheme, Loading, radius, Screen, space, Stamp, Text } from "../ui";
import { NeedsPartner } from "./NeedsPartner";

export function QuizzesScreen(props: TabProps<"Quizzes">) {
  const { linked } = useHousehold();
  if (!linked)
    return (
      <NeedsPartner body="Answer the same questions separately, then compare. Link with your partner to start." />
    );
  return <QuizList {...props} />;
}

function QuizList({ navigation }: TabProps<"Quizzes">) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { partner } = useHousehold();
  const { data, error, refreshing, refresh, reload } = useLoader(async () => {
    const [categories, progress] = await Promise.all([
      fetchCategories(),
      fetchProgress(),
    ]);
    const byId = new Map(progress.map((p) => [p.category_id, p]));
    return categories.map((c) => ({
      ...c,
      progress: byId.get(c.id) ?? { total: 0, mine: 0, partner: 0 },
    }));
  }, []);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text variant="display">Quizzes</Text>
      <Text variant="bodyMuted">
        Answer on your own. Your answers stay hidden until you have both
        finished a quiz.
      </Text>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          {data.map((c) => {
            const { total, mine, partner: theirs } = c.progress;
            const done = mine === total && total > 0;
            const both = done && theirs === total;
            const status = both
              ? "Results ready"
              : done
                ? `Waiting for ${partner?.display_name} (${theirs}/${total})`
                : mine > 0
                  ? `${mine} of ${total} answered`
                  : `${total} questions${theirs === total ? ` · ${partner?.display_name} is done` : ""}`;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}. ${status}`}
                onPress={() =>
                  navigation.navigate(done ? "QuizResults" : "QuizSession", {
                    categoryId: c.id,
                    name: c.name,
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <View style={styles.icon}>
                  <Ionicons
                    name={c.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={colors.text}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="heading">{c.name}</Text>
                  <Text variant="bodyMuted" numberOfLines={1}>
                    {c.description}
                  </Text>
                  <View style={styles.meters}>
                    <Meter side="A" value={mine} total={total} />
                    <Meter side="B" value={theirs} total={total} />
                  </View>
                  <Text variant="caption">{status}</Text>
                </View>
                {both ? (
                  <Stamp label="Ready" color={colors.success} tilt={-6} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSubtle}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  meters: { flexDirection: "row", gap: space.sm, marginTop: 2 },
  meter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
}));

/** How far each side of the tape has played. */
function Meter({
  side,
  value,
  total,
}: {
  side: "A" | "B";
  value: number;
  total: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const ink = side === "A" ? colors.sideA : colors.sideB;
  return (
    <View style={styles.meter}>
      <Text variant="tag" color={ink}>
        {side}
      </Text>
      <View style={styles.track}>
        <View
          style={{
            width: `${total ? (value / total) * 100 : 0}%`,
            height: "100%",
            backgroundColor: ink,
          }}
        />
      </View>
    </View>
  );
}
