import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { QuizScreen } from "../screens/QuizScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { MoviesScreen } from "../screens/MoviesScreen";
import { DatesScreen } from "../screens/DatesScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MainTabParamList } from "../types/navigation";
import { COLORS, FONTS } from "../constants";

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Tab Bar Icon Component
const TabBarIcon: React.FC<{ name: string; focused: boolean }> = ({
  name,
  focused,
}) => {
  const getIcon = (tabName: string) => {
    switch (tabName) {
      case "Home":
        return "🏠";
      case "Quiz":
        return "💕";
      case "Journal":
        return "📖";
      case "Movies":
        return "🎬";
      case "Dates":
        return "📅";
      case "Profile":
        return "👤";
      default:
        return "❓";
    }
  };

  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
      {getIcon(name)}
    </Text>
  );
};

// Custom Tab Bar Label Component
const TabBarLabel: React.FC<{ name: string; focused: boolean }> = ({
  name,
  focused,
}) => {
  return (
    <Text
      style={{
        ...FONTS.caption,
        color: focused ? COLORS.primary : COLORS.textSecondary,
        opacity: focused ? 1 : 0.6,
        marginTop: 4,
      }}
    >
      {name}
    </Text>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.glass,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Home" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabBarLabel name="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Quiz" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabBarLabel name="Quiz" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Journal" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabBarLabel name="Journal" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Movies"
        component={MoviesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Movies" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabBarLabel name="Movies" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Dates"
        component={DatesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Dates" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabBarLabel name="Dates" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Profile" focused={focused} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabBarLabel name="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
