// blog/BlogDetailScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BlogDetailScreen = ({ post, onGoBack }) => { // Receive post directly as prop
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0); // Safe access with optional chaining

  // Safe guard - if post is undefined, show error
  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
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
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBookmark}>
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isBookmarked ? "#007AFF" : "#333"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Image */}
        <Image source={{ uri: post.image }} style={styles.featuredImage} />

        <View style={styles.content}>
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
            <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
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
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF3B30" : "#666"} 
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {likesCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Comments', 'Comments feature would open here')}>
              <Ionicons name="chatbubble-outline" size={24} color="#666" />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#666" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Related Articles Section */}
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Articles</Text>
            <Text style={styles.relatedSubtitle}>You might also be interested in</Text>
            
            <TouchableOpacity style={styles.relatedCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300' }} 
                style={styles.relatedImage} 
              />
              <View style={styles.relatedContent}>
                <Text style={styles.relatedCardTitle}>Advanced React Native Patterns</Text>
                <Text style={styles.relatedCardExcerpt}>Learn advanced patterns for building complex applications</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
  authorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
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
    color: '#666',
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
});

export default BlogDetailScreen;