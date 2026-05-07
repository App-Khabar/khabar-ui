import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BottomNav, TopBar } from "./src/components/Shell";
import {
  BookmarksScreen,
  CategoriesScreen,
  FeedScreen,
  SearchScreen,
  SettingsScreen
} from "./src/screens";
import { themes } from "./src/theme/tokens";

export default function App() {
  const [tab, setTab] = useState("feed");
  const [darkMode, setDarkMode] = useState(false);

  const theme = useMemo(() => (darkMode ? themes.dark : themes.light), [darkMode]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}> 
      <StatusBar style={darkMode ? "light" : "dark"} />
      <TopBar theme={theme} onSearchPress={() => setTab("search")} onTitlePress={() => setTab("feed")} />

      <View style={styles.content}>
        {tab === "feed" && <FeedScreen theme={theme} />}
        {tab === "search" && <SearchScreen theme={theme} />}
        {tab === "categories" && <CategoriesScreen theme={theme} />}
        {tab === "bookmarks" && <BookmarksScreen theme={theme} />}
        {tab === "settings" && (
          <SettingsScreen theme={theme} darkMode={darkMode} onToggleTheme={() => setDarkMode((v) => !v)} />
        )}
      </View>

      <BottomNav theme={theme} activeTab={tab} onSelect={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  content: {
    flex: 1
  }
});