import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../config/api';
import { useUser } from '../../context/UserContext';
import CreateBlogScreen from './CreateBlogScreen';

const BlogScreen = ({ onNavigateToBlogDetail }) => {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPost, setMenuPost] = useState(null);

  const categories = [
    { name: 'All', color: '#666', icon: 'apps' },
    { name: 'Daily Med Tips', color: '#2196F3', icon: 'bulb' },
    { name: 'Side Effects Stories', color: '#FF9800', icon: 'warning' },
    { name: 'Success Journeys', color: '#4CAF50', icon: 'trophy' },
    { name: 'Ask the Community', color: '#9C27B0', icon: 'chatbubbles' },
    { name: 'Professional Advice', color: '#F44336', icon: 'medical' },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch('/api/blogs');
      if (Array.isArray(data)) {
        const normalized = data.map((p) => ({
          ...p,
          id: String(p.id || p._id || ''),
          tags: Array.isArray(p.tags)
            ? p.tags
            : String(p.tags || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
        }));
        setPosts(normalized);
      } else {
        setPosts(blogPosts);
      }
    } catch (e) {
      setPosts(blogPosts);
    } finally {
      setRefreshing(false);
    }
  };

  // When user taps Share button, show create screen; on creation, add to list
  if (showCreate) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <CreateBlogScreen
          initial={editingPost}
          onCreated={(created) => {
            const normalized = {
              ...created,
              id: String(created.id || created._id || ''),
              tags: Array.isArray(created.tags)
                ? created.tags
                : String(created.tags || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            };
            setPosts((prev) => [normalized, ...prev]);
            setShowCreate(false);
            setEditingPost(null);
          }}
          onUpdated={(updated) => {
            const normalized = {
              ...updated,
              id: String(updated.id || updated._id || editingPost?.id || editingPost?._id || ''),
              tags: Array.isArray(updated.tags)
                ? updated.tags
                : String(updated.tags || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            };
            const matchId = String(updated.id || updated._id || editingPost?.id || editingPost?._id || '');
            setPosts((prev) => prev.map(p => (String(p.id || p._id) === matchId ? { ...p, ...normalized } : p)));
            setShowCreate(false);
            setEditingPost(null);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </SafeAreaView>
    );
  }

  const handleHelpful = (postId) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        String(post.id || post._id) === String(postId)
          ? { ...post, helpfulCount: post.helpfulCount + 1, likes: post.likes + 1 }
          : post
      )
    );
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : '#666';
  };

  const handlePostPress = (post) => {
    if (onNavigateToBlogDetail) {
      onNavigateToBlogDetail(post);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

  const isOwner = (post) => {
    const owner = String(post?.userId || '');
    const me = String(user?.uid || user?.email || '');
    return owner && me && owner === me;
  };

  const renderPostItem = ({ item }) => {
    const categoryColor = getCategoryColor(item.category);
    return (
      <TouchableOpacity style={styles.postCard} onPress={() => handlePostPress(item)}>
        {/* Category Header */}
        <View style={[styles.categoryHeader, { backgroundColor: categoryColor + '15' }]}>
          <View style={styles.categoryLeft}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.headerRightRow}>
            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4A90E2" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                if (!isOwner(item)) {
                  Alert.alert('Not allowed', 'You do not have permission to modify this blog', [
                    {
                      text: 'OK',
                      onPress: () => {},
                    },
                  ]);
                  return;
                }
                setMenuPost(item);
                setMenuVisible(true);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postExcerpt}>{item.excerpt}</Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTags}>+{item.tags.length - 3} more</Text>
            )}
          </View>

          {/* Author & Stats */}
          <View style={styles.postFooter}>
            <View style={styles.authorSection}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.isAnonymous ? 'A' : item.author.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>
                  {item.isAnonymous ? 'Anonymous' : item.author}
                </Text>
                <Text style={styles.authorRole}>{item.authorRole}</Text>
              </View>
            </View>

            <View style={styles.actionsRight}>
              <Text style={styles.postDate}>{formatDate(item.date)}</Text>
              <View style={styles.stats}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => handleHelpful(item.id || item._id)}
                >
                  <Ionicons name="heart" size={16} color="#FF6B6B" />
                  <Text style={styles.statText}>{item.helpfulCount}</Text>
                </TouchableOpacity>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={14} color="#666" />
                  <Text style={styles.statText}>{item.readTime}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleEdit = (post) => {
    if (!isOwner(post)) {
      Alert.alert('Not allowed', 'You do not have permission to edit this blog');
      return;
    }
    setEditingPost(post);
    setShowCreate(true);
  };

  const handleDelete = (post) => {
    if (!isOwner(post)) {
      Alert.alert('Not allowed', 'You do not have permission to delete this blog');
      return;
    }
    setPendingDelete(post);
    setConfirmText('');
    setConfirmVisible(true);
  };

  const performDelete = async () => {
    if (!pendingDelete) return;
    const targetId = String(pendingDelete.id || pendingDelete._id);
    const me = encodeURIComponent(user?.uid || user?.email || '');
    const url = `/api/blogs/${encodeURIComponent(targetId)}?userId=${me}`;
    console.log('DELETE request:', url);
    try {
      await apiFetch(url, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => String(p.id || p._id) !== targetId));
      setConfirmVisible(false);
      setPendingDelete(null);
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting blog:', error);
      Alert.alert('Error', error.message || 'Failed to delete blog');
    }
  };

  const cancelDelete = () => {
    setConfirmVisible(false);
    setPendingDelete(null);
    setConfirmText('');
  };



  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.name && [styles.categoryChipActive, { backgroundColor: item.color }]
      ]}
      onPress={() => setSelectedCategory(item.name)}
    >
      <Ionicons
        name={item.icon}
        size={16}
        color={selectedCategory === item.name ? '#fff' : item.color}
      />
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item.name && styles.categoryChipTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MedTalks</Text>
          <Text style={styles.headerSubtitle}>Share • Learn • Heal Together</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.8} onPress={() => { setEditingPost(null); setShowCreate(true); }}>
          <Ionicons name="add-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search symptoms, medications, or experiences..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => String(item.id || item._id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPosts}
            colors={['#4CAF50']}
          />
        }
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyStateText}>No stories found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try different search terms' : 'Be the first to share your experience'}
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyStateButtonText}>Share Your Story</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Confirm Delete Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={cancelDelete}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to delete this blog? Type DELETE_BLOG to confirm.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type DELETE_BLOG"
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.actionButton, styles.modalCancel]} onPress={cancelDelete}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.modalDanger, confirmText !== 'DELETE_BLOG' && { opacity: 0.5 }]}
                onPress={performDelete}
                disabled={confirmText !== 'DELETE_BLOG'}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Post Options Menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.menuOverlay}>
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                if (menuPost) handleEdit(menuPost);
                setMenuVisible(false);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#333" />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuDangerItem]}
              onPress={() => {
                if (menuPost) handleDelete(menuPost);
                setMenuVisible(false);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#F44336" />
              <Text style={[styles.menuItemText, styles.menuDangerText]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop:25
  },
  headerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4A90E2',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E8B57',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 6,
    marginLeft: 6,
    borderRadius: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#4A90E2',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  postContent: {
    padding: 20,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  postExcerpt: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  moreTags: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  authorRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontWeight: '500',
  },
  statsSection: {
    alignItems: 'flex-end',
  },
  actionsRight: {
    alignItems: 'flex-end',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  menuBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  menuDangerItem: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  menuDangerText: {
    color: '#F44336',
  },
  menuCancel: {
    marginTop: 6,
    backgroundColor: '#f7f7f7',
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  menuCancelText: {
    color: '#333',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  emptyStateButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#fafafa',
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancel: {
    backgroundColor: '#eee',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '700',
  },
  modalDanger: {
    backgroundColor: '#F44336',
    marginLeft: 8,
  },
  modalDangerText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default BlogScreen;