import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { bookmarks, categories, trendingTags, worldNewsToday } from "../data/content";
import { radius, spacing, typography } from "../theme/tokens";
import { SectionTitle } from "../components/Shell";
import { fetchBackendNewsFeed } from "../config/api";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const templateArticleUrl =
  "https://www.ndtv.com/india-news/grounds-raised-are-unreasonable-umar-khalids-interim-bail-request-denied-11517297";
const normalizeUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const getScreenProfile = (width, height) => {
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);

  if (width >= 1200) return { key: "desktop", pagePad: 28, maxContentWidth: 860, titleScale: 1.08, summaryScale: 1.04, cardGap: 20 };
  if (width >= 900 || shortest >= 700) return { key: "tablet", pagePad: 24, maxContentWidth: 760, titleScale: 1.02, summaryScale: 1.02, cardGap: 18 };
  if (width >= 600 || longest >= 980) return { key: "phablet", pagePad: 20, maxContentWidth: 620, titleScale: 1, summaryScale: 1, cardGap: 16 };
  if (width >= 414) return { key: "large-phone", pagePad: 18, maxContentWidth: 560, titleScale: 0.98, summaryScale: 0.98, cardGap: 14 };
  if (width >= 375) return { key: "regular-phone", pagePad: 16, maxContentWidth: 520, titleScale: 0.95, summaryScale: 0.95, cardGap: 12 };
  return { key: "small-phone", pagePad: 14, maxContentWidth: 480, titleScale: 0.9, summaryScale: 0.9, cardGap: 10 };
};

const getTypeScale = (profileKey) => {
  switch (profileKey) {
    case "small-phone":
      return { sectionTitle: 44, sectionSubtitle: 18, cardTitle: 28, body: 14, meta: 11, chip: 11, cardLabel: 22 };
    case "regular-phone":
      return { sectionTitle: 46, sectionSubtitle: 19, cardTitle: 30, body: 15, meta: 11.5, chip: 11.5, cardLabel: 23 };
    case "large-phone":
      return { sectionTitle: 48, sectionSubtitle: 20, cardTitle: 32, body: 16, meta: 12, chip: 12, cardLabel: 24 };
    case "phablet":
      return { sectionTitle: 50, sectionSubtitle: 21, cardTitle: 34, body: 16.5, meta: 12.5, chip: 12, cardLabel: 25 };
    case "tablet":
      return { sectionTitle: 54, sectionSubtitle: 22, cardTitle: 36, body: 17, meta: 13, chip: 12.5, cardLabel: 26 };
    default:
      return { sectionTitle: 58, sectionSubtitle: 24, cardTitle: 38, body: 18, meta: 13.5, chip: 13, cardLabel: 27 };
  }
};

export function FeedScreen({ theme }) {
  const isWeb = typeof window !== "undefined";
  const isTouchWeb = isWeb && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const { width, height } = useWindowDimensions();
  const profile = getScreenProfile(width, height);
  const typeScale = getTypeScale(profile.key);
  const [index, setIndex] = useState(0);
  const [articleItems, setArticleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const wheelLockRef = useRef(0);
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const activeItem = articleItems[index];
  const fallbackImage = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80";

  const loadArticles = async () => {
    setLoading(true);
    setApiError("");
    try {
      const data = await fetchBackendNewsFeed();
      if (Array.isArray(data) && data.length > 0) {
        setArticleItems(data);
        setIndex(0);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        setArticleItems(worldNewsToday);
        setIndex(0);
        setLastUpdated("Template mode");
        setApiError("Live API connected, but no articles found. Showing template articles.");
      }
    } catch (_err) {
      setArticleItems(worldNewsToday);
      setIndex(0);
      setLastUpdated("Template mode");
      setApiError("Live API connection failed. Showing template articles.");
    } finally {
      setLoading(false);
    }
  };

  const openArticle = (value) => {
    const safeUrl = normalizeUrl(value);
    if (!safeUrl) return;
    if (typeof window !== "undefined") {
      window.location.assign(safeUrl);
      return;
    }
    Linking.openURL(safeUrl);
  };

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (!Array.isArray(articleItems) || articleItems.length === 0) return;
    articleItems.slice(0, 20).forEach((item) => {
      const uri = item?.image ? String(item.image) : "";
      if (uri) {
        Image.prefetch(uri).catch(() => {});
      }
    });
  }, [articleItems]);

  const viewportSafeHeight = Math.max(420, height - 64 - 64 - profile.cardGap * 2 - 42);
  const cardWidth = clamp(Math.min(width - profile.pagePad * 2, profile.maxContentWidth), 280, 560);
  const cardHeight = clamp(viewportSafeHeight, 480, 760);
  const imageHeight = clamp(cardHeight * 0.33, 180, 280);
  const titleSize = clamp(width * 0.06 * profile.titleScale, typeScale.cardTitle - 6, typeScale.cardTitle);
  const titleLine = clamp(titleSize * 1.24, 34, 50);
  const summarySize = clamp(width * 0.03 * profile.summaryScale, 14, 20);
  const summaryLine = clamp(summarySize * 1.6, 24, 34);
  const compactCard = cardHeight < 640 || profile.key === "small-phone";
  const titleLines = compactCard ? 3 : 4;
  const summaryLines = compactCard ? 5 : 7;

  const xInfluence = panX.interpolate({ inputRange: [-width, 0, width], outputRange: [0.2, 0, 0.2], extrapolate: "clamp" });
  const yInfluence = panY.interpolate({ inputRange: [-height, 0, height], outputRange: [0.2, 0, 0.2], extrapolate: "clamp" });
  const dragInfluence = Animated.add(xInfluence, yInfluence);
  const activeOpacity = dragInfluence.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0.6], extrapolate: "clamp" });
  const activeScale = dragInfluence.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0.93], extrapolate: "clamp" });
  const activeRotate = panX.interpolate({ inputRange: [-width, 0, width], outputRange: ["-10deg", "0deg", "10deg"], extrapolate: "clamp" });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8 || Math.abs(gesture.dx) > 8,
        onPanResponderMove: (_, gesture) => {
          panX.setValue(gesture.dx);
          panY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          const threshold = 70;
          const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
          const crossed = isHorizontal ? Math.abs(gesture.dx) > threshold : Math.abs(gesture.dy) > threshold;

          if (!crossed) {
            Animated.parallel([
              Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 7 }),
              Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 7 })
            ]).start();
            return;
          }

          let targetIndex = index;
          let toX = gesture.dx * 0.35;
          let toY = gesture.dy * 0.35;

          if (isHorizontal) {
            if (gesture.dx < 0) {
              targetIndex = index + 1;
              toX = -width * 1.15;
            } else {
              targetIndex = index - 1;
              toX = width * 1.15;
            }
            toY = gesture.dy * 0.22;
          } else {
            if (gesture.dy < 0) {
              targetIndex = index + 1;
              toY = -height * 1.1;
            } else {
              targetIndex = index - 1;
              toY = height * 1.1;
            }
            toX = gesture.dx * 0.22;
          }

          const boundedIndex = Math.max(0, Math.min(articleItems.length - 1, targetIndex));

          if (boundedIndex === index) {
            Animated.parallel([
              Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 7 }),
              Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 7 })
            ]).start();
            return;
          }

          Animated.parallel([
            Animated.timing(panX, { toValue: toX, duration: 260, useNativeDriver: true }),
            Animated.timing(panY, { toValue: toY, duration: 260, useNativeDriver: true })
          ]).start(() => {
            setIndex(boundedIndex);
            panX.setValue(-toX * 0.08);
            panY.setValue(-toY * 0.08);
            Animated.parallel([
              Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }),
              Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 })
            ]).start();
          });
        }
      }),
    [articleItems.length, height, index, panX, panY, width]
  );

  const animateToIndex = (targetIndex, direction = "next", axis = "vertical") => {
    if (targetIndex < 0 || targetIndex > articleItems.length - 1 || targetIndex === index) return;
    const toY = axis === "vertical" ? (direction === "next" ? -height * 0.9 : height * 0.9) : 0;
    const toX = axis === "horizontal" ? (direction === "next" ? -width * 0.9 : width * 0.9) : 0;

    Animated.parallel([
      Animated.timing(panX, { toValue: toX, duration: 220, useNativeDriver: true }),
      Animated.timing(panY, { toValue: toY, duration: 220, useNativeDriver: true })
    ]).start(() => {
      setIndex(targetIndex);
      panX.setValue(-toX * 0.08);
      panY.setValue(-toY * 0.08);
      Animated.parallel([
        Animated.spring(panX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 }),
        Animated.spring(panY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 5 })
      ]).start();
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onWheel = (event) => {
      if (!articleItems.length) return;
      const now = Date.now();
      if (now - wheelLockRef.current < 280) return;
      const absX = Math.abs(event.deltaX || 0);
      const absY = Math.abs(event.deltaY || 0);
      if (absX < 18 && absY < 18) return;
      wheelLockRef.current = now;

      if (absY >= absX) {
        if (event.deltaY > 0) animateToIndex(Math.min(articleItems.length - 1, index + 1), "next", "vertical");
        else animateToIndex(Math.max(0, index - 1), "prev", "vertical");
      } else {
        if (event.deltaX > 0) animateToIndex(Math.min(articleItems.length - 1, index + 1), "next", "horizontal");
        else animateToIndex(Math.max(0, index - 1), "prev", "horizontal");
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [articleItems.length, height, index, width]);

  if (loading) {
    return (
      <View style={[styles.feedRoot, { backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.meta, { color: theme.textMuted }]}>Loading...</Text>
      </View>
    );
  }

  if (!activeItem) {
    return (
      <View style={[styles.feedRoot, { backgroundColor: theme.bg, justifyContent: "center", alignItems: "center", padding: spacing.lg }]}>
        <Text style={[styles.body, { color: theme.text, textAlign: "center" }]}>{apiError || "No data available."}</Text>
        <Pressable style={[styles.refreshBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]} onPress={loadArticles}>
          <Text style={[styles.label, { color: theme.primary }]}>Retry live API sync</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.feedRoot, { backgroundColor: theme.bg }]}>
      <View style={styles.pageWrap} {...(isWeb && !isTouchWeb ? {} : panResponder.panHandlers)}>
        <Animated.View
          style={[
            styles.worldCard,
            {
              width: cardWidth,
              height: cardHeight,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: activeOpacity,
              transform: [{ translateX: panX }, { translateY: panY }, { rotate: activeRotate }, { scale: activeScale }]
            }
          ]}
        >
          <View style={styles.worldImageWrap}>
            <Image source={{ uri: activeItem.image || fallbackImage }} style={[styles.worldImage, { height: imageHeight }]} />
            <View style={[styles.worldCategoryChip, { backgroundColor: theme.surface }]}>
              <Text style={[styles.label, { color: theme.primary }]}>{activeItem.category}</Text>
            </View>
          </View>

          <View style={styles.worldContent}>
            <View>
              <Text numberOfLines={titleLines} style={[styles.worldTitle, { color: theme.text, fontSize: titleSize, lineHeight: titleLine }]}>{activeItem.title}</Text>
              <Text numberOfLines={summaryLines} style={[styles.worldSummary, { color: theme.textMuted, fontSize: summarySize, lineHeight: summaryLine }]}>{activeItem.summary}</Text>
            </View>

            <View style={styles.worldFooter}>
              <Text style={[styles.meta, { color: theme.textMuted, fontSize: typeScale.meta }]}>{activeItem.source} • {activeItem.publishedAt}</Text>
              {isWeb ? (
                <Text
                  href={normalizeUrl(templateArticleUrl)}
                  hrefAttrs={{ target: "_blank", rel: "noopener noreferrer" }}
                  style={[styles.readLink, { color: theme.primary, fontSize: typeScale.body }]}
                >
                  Read this article
                </Text>
              ) : (
                <Pressable
                  onPress={() => openArticle(templateArticleUrl)}
                >
                  <Text style={[styles.readLink, { color: theme.primary, fontSize: typeScale.body }]}>Read this article</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

export function CategoriesScreen({ theme }) {
  const { width, height } = useWindowDimensions();
  const profile = getScreenProfile(width, height);
  const typeScale = getTypeScale(profile.key);
  const [articleItems, setArticleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridColumns = width >= 1200 ? 4 : width >= 900 ? 3 : 2;
  const cardWidthPercent = gridColumns === 4 ? "23.5%" : gridColumns === 3 ? "31.5%" : "48%";
  const categoryFontSize = clamp(typeScale.cardLabel - 3, 16, 22);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchBackendNewsFeed();
        setArticleItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categoryCounts = useMemo(() => {
    const map = new Map();
    articleItems.forEach((item) => {
      const key = item.category || "Uncategorized";
      map.set(key, (map.get(key) || 0) + 1);
    });
    const fromBackend = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    if (fromBackend.length) return fromBackend;
    return categories.map((name) => ({ name, count: 0 }));
  }, [articleItems]);

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.bg, paddingHorizontal: profile.pagePad }]}> 
      <SectionTitle
        theme={theme}
        title="Global News Topics"
        subtitle=""
        titleStyle={{ fontSize: typeScale.sectionTitle, lineHeight: typeScale.sectionTitle + 6 }}
        subtitleStyle={{ fontSize: typeScale.sectionSubtitle, lineHeight: typeScale.sectionSubtitle + 8 }}
      />
      <View style={[styles.grid, { gap: Math.max(10, profile.cardGap - 2) }]}> 
        {categoryCounts.map((item) => (
          <Pressable key={item.name} style={[styles.card, { width: cardWidthPercent, backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.h3, { color: theme.text, fontSize: categoryFontSize, textAlign: "center" }]}>
              {item.name}{item.count ? ` (${item.count})` : ""}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export function SearchScreen({ theme }) {
  const { width, height } = useWindowDimensions();
  const profile = getScreenProfile(width, height);
  const typeScale = getTypeScale(profile.key);
  const [query, setQuery] = useState("");
  const [articleItems, setArticleItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBackendNewsFeed();
        setArticleItems(Array.isArray(data) ? data : []);
      } catch (_err) {
        setArticleItems([]);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articleItems.slice(0, 8);
    return articleItems.filter((item) => item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
  }, [articleItems, query]);

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.bg, paddingHorizontal: profile.pagePad }]}> 
      <SectionTitle
        theme={theme}
        title="Search"
        subtitle="Find news, topics, and regions from live API data."
        titleStyle={{ fontSize: typeScale.sectionTitle, lineHeight: typeScale.sectionTitle + 6 }}
        subtitleStyle={{ fontSize: typeScale.sectionSubtitle, lineHeight: typeScale.sectionSubtitle + 8 }}
      />
      <TextInput
        placeholder="Search news..."
        value={query}
        onChangeText={setQuery}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
      />
      <Text style={[styles.h3, { color: theme.text, marginTop: spacing.lg, fontSize: typeScale.cardLabel }]}>Live Results</Text>
      {filtered.map((item) => (
        <Pressable key={`${item.id}-${item.title}`} onPress={() => Linking.openURL(item.url)} style={[styles.searchResult, { borderBottomColor: theme.border }]}> 
          <Text numberOfLines={2} style={[styles.body, { color: theme.text, marginTop: 0 }]}>{item.title}</Text>
          <Text style={[styles.meta, { color: theme.textMuted, marginTop: 2 }]}>{item.category} • {item.source}</Text>
        </Pressable>
      ))}
      <View style={styles.tags}>
        {trendingTags.map((tag) => (
          <View key={tag} style={[styles.tag, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}> 
            <Text style={[styles.label, { color: theme.text, fontSize: typeScale.chip }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function BookmarksScreen({ theme }) {
  const { width, height } = useWindowDimensions();
  const profile = getScreenProfile(width, height);
  const typeScale = getTypeScale(profile.key);
  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.bg, paddingHorizontal: profile.pagePad }]}> 
      <SectionTitle
        theme={theme}
        title="Saved Stories"
        subtitle="Your personalized collection."
        titleStyle={{ fontSize: typeScale.sectionTitle, lineHeight: typeScale.sectionTitle + 6 }}
        subtitleStyle={{ fontSize: typeScale.sectionSubtitle, lineHeight: typeScale.sectionSubtitle + 8 }}
      />
      {bookmarks.map((item) => (
        <View key={item.title} style={[styles.rowCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={[styles.thumb, { backgroundColor: theme.surfaceAlt2 }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.meta, { color: theme.primary, fontSize: typeScale.meta }]}>{item.topic} • {item.read}</Text>
            <Text style={[styles.body, { color: theme.text, fontSize: typeScale.body, lineHeight: typeScale.body + 8 }]}>{item.title}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export function SettingsScreen({ theme, darkMode, onToggleTheme }) {
  const { width, height } = useWindowDimensions();
  const profile = getScreenProfile(width, height);
  const typeScale = getTypeScale(profile.key);
  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.bg, paddingHorizontal: profile.pagePad }]}> 
      <SectionTitle
        theme={theme}
        title="Settings"
        subtitle="Customize your reading experience and security."
        titleStyle={{ fontSize: typeScale.sectionTitle, lineHeight: typeScale.sectionTitle + 6 }}
        subtitleStyle={{ fontSize: typeScale.sectionSubtitle, lineHeight: typeScale.sectionSubtitle + 8 }}
      />
      <View style={[styles.settingsBlock, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}> 
        <SettingRow theme={theme} label="Account" value="Premium" typeScale={typeScale} />
        <SettingRow theme={theme} label="Notifications" value="Enabled" typeScale={typeScale} />
        <Pressable style={styles.settingRow} onPress={onToggleTheme}>
          <Text style={[styles.body, { color: theme.text, fontSize: typeScale.body }]}>Dark Mode</Text>
          <Text style={[styles.meta, { color: theme.primary, fontSize: typeScale.meta }]}>{darkMode ? "ON" : "OFF"}</Text>
        </Pressable>
        <SettingRow theme={theme} label="Language" value="English (UK)" typeScale={typeScale} />
      </View>
      <Pressable style={[styles.signout, { backgroundColor: theme.dangerBg }]}>
        <Text style={[styles.body, { color: theme.dangerText, textAlign: "center", fontWeight: "700", fontSize: typeScale.body }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function SettingRow({ theme, label, value, typeScale }) {
  return (
    <View style={styles.settingRow}>
      <Text style={[styles.body, { color: theme.text, fontSize: typeScale?.body }]}>{label}</Text>
      <Text style={[styles.meta, { color: theme.textMuted, fontSize: typeScale?.meta }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  feedRoot: { flex: 1 },
  pageWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.container,
    paddingVertical: spacing.md
  },
  page: {
    padding: spacing.container,
    paddingBottom: spacing.xl
  },
  body: {
    ...typography.body,
    marginTop: spacing.xs,
    lineHeight: 24
  },
  meta: {
    ...typography.label,
    marginTop: spacing.xs
  },
  label: typography.label,
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  card: {
    width: "47%",
    minHeight: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  h3: typography.h3,
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...typography.body
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: "center"
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: radius.sm
  },
  settingsBlock: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md
  },
  settingRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  signout: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    paddingVertical: 14
  },
  worldCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    paddingBottom: spacing.md
  },
  worldImageWrap: {
    position: "relative"
  },
  worldImage: {
    width: "100%"
  },
  worldCategoryChip: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm
  },
  worldTitle: {
    ...typography.h2,
    marginTop: spacing.md
  },
  worldSummary: {
    ...typography.body,
    marginTop: spacing.xs
  },
  readLink: {
    ...typography.body,
    marginTop: spacing.sm,
    textDecorationLine: "underline",
    fontWeight: "700"
  },
  worldContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: "space-between",
    paddingBottom: spacing.sm
  },
  worldFooter: {
    minHeight: 54,
    justifyContent: "flex-end"
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: spacing.md
  },
  searchResult: {
    borderBottomWidth: 1,
    paddingVertical: 10
  }
});
