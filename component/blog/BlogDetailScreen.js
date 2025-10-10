import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from '../common/Icon';
import { apiFetch } from '../../config/api';
import { useUser } from '../../context/UserContext';

const CATEGORY_COVERS = {
  'Daily Med Tips': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
  'Side Effects Stories': 'https://images.unsplash.com/photo-1582719478250-046d5e8b9d7a?w=1200',
  'Success Journeys': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200',
  'Ask the Community': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200',
  'Professional Advice': 'https://images.unsplash.com/photo-1580281657521-6c0d03317f6f?w=1200',
  'All': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1200',
};

function getCategoryCover(category) {
  if (!category) return CATEGORY_COVERS['All'];
  return CATEGORY_COVERS[category] || CATEGORY_COVERS['All'];
}

const BlogDetailScreen = ({ post, onGoBack }) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const currentUserId = (user?.id || user?.uid || user?.email || '').toString();
  const currentUserName = user?.name || user?.displayName || user?.email || 'User';

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Article not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${post.title}\n\n${post.excerpt}`,
        title: post.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const loadComments = async () => {
    if (!post?.id) return;
    try {
      setLoadingComments(true);
      const list = await apiFetch(`/api/blogs/${encodeURIComponent(post.id)}/comments`, { method: 'GET' });
      setComments(Array.isArray(list) ? list : []);
    } catch (e) {
      // silent fail to avoid interrupting reading
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    if (!currentUserId) {
      Alert.alert('Login required', 'Please login to comment');
      return;
    }
    try {
      const saved = await apiFetch(`/api/blogs/${encodeURIComponent(post.id)}/comments`, {
        method: 'POST',
        body: { text, userId: currentUserId, userName: currentUserName },
      });
      setComments((prev) => [...prev, saved]);
      setCommentText('');
      setShowCommentBox(false);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to add comment');
    }
  };

  React.useEffect(() => {
    // Initialize likes state if post.likes is an array
    if (Array.isArray(post?.likes)) {
      setLikesCount(post.likes.length);
      setIsLiked(post.likes.includes(currentUserId));
    }
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, currentUserId]);

  const handleLike = async () => {
    if (!post?.id) return;
    if (!currentUserId) {
      Alert.alert('Login required', 'Please login to like this post');
      return;
    }
    try {
      const resp = await apiFetch(`/api/blogs/${encodeURIComponent(post.id)}/like`, {
        method: 'POST',
        body: { userId: currentUserId },
      });
      const likes = Array.isArray(resp?.likes) ? resp.likes : [];
      setLikesCount(likes.length);
      setIsLiked(likes.includes(currentUserId));
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to like');
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    Alert.alert(
      isBookmarked ? 'Removed from Bookmarks' : 'Added to Bookmarks',
      isBookmarked ? 'Article removed from your bookmarks' : 'Article saved to your bookmarks'
    );
  };

  const handleBackPress = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  const handleSummarize = async () => {
    if (!post?.content) {
      Alert.alert('No content', 'This post has no content to summarize.');
      return;
    }
    try {
      setSummarizing(true);
      setSummaryVisible(true);
      setSummaryText('');
      const resp = await apiFetch('/api/blogs/summarize', {
        method: 'POST',
        body: { title: post.title || '', content: post.content || '' },
      });
      setSummaryText(resp?.summary || 'No summary returned.');
    } catch (e) {
      setSummaryText(`Failed to summarize: ${e.message || ''}`.trim());
    } finally {
      setSummarizing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContent = () => {
    if (!post.content) return null;

    const paragraphs = post.content.split('\n\n');
    return paragraphs.map((paragraph, index) => {
      if (paragraph.startsWith('## ')) {
        return (
          <Text key={index} style={styles.subheading}>
            {paragraph.replace('## ', '')}
          </Text>
        );
      } else if (paragraph.startsWith('### ')) {
        return (
          <Text key={index} style={styles.subsubheading}>
            {paragraph.replace('### ', '')}
          </Text>
        );
      } else if (paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter(item => item.startsWith('- '));
        return (
          <View key={index} style={styles.list}>
            {items.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.listItem}>
                • {item.replace('- ', '')}
              </Text>
            ))}
          </View>
        );
      } else if (paragraph.startsWith('1. ')) {
        const items = paragraph.split('\n').filter(item => /^\d+\./.test(item));
        return (
          <View key={index} style={styles.numberedList}>
            {items.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.numberedListItem}>
                {itemIndex + 1}. {item.replace(/^\d+\.\s/, '')}
              </Text>
            ))}
          </View>
        );
      } else {
        return (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        );
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Icon name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBookmark}>
            <Icon 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isBookmarked ? "#007AFF" : "#333"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Icon name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Image
            source={{ uri: getCategoryCover(post.category) }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
          {/* Category and Date */}
          <View style={styles.metaInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>
            <Text style={styles.date}>{formatDate(post.date)} • {post.readTime}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Excerpt */}
          <Text style={styles.excerpt}>{post.excerpt}</Text>

          {/* Author Info */}
          <View style={styles.authorContainer}>
            {/* <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} /> */}
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                  {post.isAnonymous ? 'A' : post.author.charAt(0)}
              </Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.authorRole}>{post.authorRole}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {post.tags && post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {renderContent()}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>

            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Icon 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF3B30" : "#666"} 
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {likesCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Icon name="share-outline" size={24} color="#666" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleSummarize}>
              <Icon name="bulb-outline" size={24} color="#666" />
              <Text style={styles.actionText}>AI Summary</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments</Text>
            {loadingComments ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color="#007AFF" />
              </View>
            ) : comments.length === 0 ? (
              <Text style={styles.commentsEmpty}>No comments yet. Be the first to comment.</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{(c.userName || 'U').charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{c.userName || 'User'}</Text>
                      <Text> • {new Date(c.createdAt).toLocaleString()}</Text>
                    </Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))
            )}
            {/* Toggleable comment composer */}
            {!showCommentBox ? (
              <TouchableOpacity style={styles.postCommentButton} onPress={() => setShowCommentBox(true)}>
                <Icon name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.postCommentText}>Post Comment</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addCommentBox}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write a comment..."
                  style={styles.commentInput}
                  multiline
                  autoFocus
                />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                  <TouchableOpacity style={[styles.commentSend, { backgroundColor: '#9E9E9E' }]} onPress={() => { setShowCommentBox(false); setCommentText(''); }}>
                    <Text style={styles.commentSendText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.commentSend} onPress={submitComment}>
                    <Icon name="send" size={18} color="#fff" />
                    <Text style={styles.commentSendText}>Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* AI Summary Modal */}
        <Modal visible={summaryVisible} transparent animationType="fade" onRequestClose={() => setSummaryVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>AI Summary</Text>
              {summarizing ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.modalHint}>Summarizing...</Text>
                </View>
              ) : (
                <ScrollView style={styles.modalContent}>
                  <Text style={styles.modalText}>{summaryText}</Text>
                </ScrollView>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalClose]} onPress={() => setSummaryVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop:25
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  featuredImage: {
    width: '100%',
    height: 280,
  },
  content: {
    padding: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 38,
    marginBottom: 12,
  },
  excerpt: {
    fontSize: 18,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  authorRole: {
    fontSize: 14,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#1552bcff',
    fontWeight: '500',
  },
  contentContainer: {
    marginBottom: 30,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  subheading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 28,
  },
  subsubheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 24,
  },
  list: {
    marginBottom: 16,
    paddingLeft: 16,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
  },
  numberedList: {
    marginBottom: 16,
    paddingLeft: 16,
  },
  numberedListItem: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 20,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    flexDirection: 'row',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#FF3B30',
  },
  relatedSection: {
    marginBottom: 30,
  },
  relatedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  relatedSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  relatedCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  relatedImage: {
    width: 100,
    height: 100,
  },
  relatedContent: {
    flex: 1,
    padding: 12,
  },
  relatedCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  relatedCardExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
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
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalContent: {
    maxHeight: 320,
  },
  modalText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalButtons: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalClose: {
    backgroundColor: '#007AFF',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  modalHint: {
    color: '#666',
    marginTop: 10,
  },
  // Comments styling
  commentsSection: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  commentsEmpty: {
    color: '#757575',
    fontSize: 14,
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  commentAvatarText: {
    color: '#1976D2',
    fontWeight: '700',
  },
  commentMeta: {
    color: '#616161',
    marginBottom: 2,
  },
  commentAuthor: {
    color: '#0D47A1',
    fontWeight: '700',
  },
  commentText: {
    color: '#333',
    lineHeight: 20,
  },
  addCommentBox: {
    marginTop: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
    padding: 10,
  },
  commentInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  commentSend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  commentSendText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
  postCommentButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1552bcff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#1552bcff',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  postCommentText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default BlogDetailScreen;
