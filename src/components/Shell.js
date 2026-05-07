import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { spacing, typography } from "../theme/tokens";

const navItems = [
  { key: "feed", icon: "home-filled", label: "Home" },
  { key: "categories", icon: "explore", label: "Explore" },
  { key: "bookmarks", icon: "bookmark", label: "Saved" },
  { key: "settings", icon: "person", label: "Profile" }
];

export function TopBar({ theme, onSearchPress, onTitlePress }) {
  return (
    <View style={[styles.topBar, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      <Pressable accessibilityLabel="Open menu" style={styles.iconButton}>
        <MaterialIcons color={theme.primary} name="menu" size={26} />
      </Pressable>

      <Pressable onPress={onTitlePress}>
        <Text style={[styles.brand, { color: theme.primary }]}>KHABAR</Text>
      </Pressable>

      <Pressable accessibilityLabel="Open search" onPress={onSearchPress} style={styles.iconButton}>
        <MaterialIcons color={theme.primary} name="search" size={24} />
      </Pressable>
    </View>
  );
}

export function BottomNav({ theme, activeTab, onSelect }) {
  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
      {navItems.map((item) => {
        const isActive = item.key === activeTab;
        const color = isActive ? theme.primary : theme.navInactive;
        return (
          <Pressable key={item.key} accessibilityLabel={item.label} onPress={() => onSelect(item.key)} style={styles.iconButton}>
            <MaterialIcons color={color} name={item.icon} size={25} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionTitle({ theme, title, subtitle, titleStyle, subtitleStyle }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.h2, { color: theme.text }, titleStyle]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: theme.textMuted }, subtitleStyle]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 64,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.container,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    ...typography.title,
    fontSize: 28
  },
  bottomNav: {
    height: 64,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  h2: {
    ...typography.h2
  },
  subtitle: {
    ...typography.body,
    marginTop: 4
  }
});
