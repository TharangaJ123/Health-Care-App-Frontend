// BlogScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BlogScreen = ({ onNavigateToBlogDetail  }) => {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mock data - replace with your API call
  const blogPosts = [
    {
      id: '1',
      title: 'The Future of Mobile Development',
      excerpt: 'Exploring the latest trends and technologies shaping mobile app development in 2024.',
      content: `Mobile development has undergone significant changes in recent years. With the rise of cross-platform frameworks like React Native and Flutter, developers can now build applications for multiple platforms using a single codebase.

## The Rise of Cross-Platform Development

React Native continues to dominate the cross-platform space, offering near-native performance with the flexibility of JavaScript. The recent improvements in Hermes engine and the new architecture have made React Native apps even faster and more reliable.

### Key Trends for 2024

1. **AI Integration**: Mobile apps are increasingly incorporating AI features
2. **5G Optimization**: Leveraging faster network speeds for better user experiences
3. **Privacy-First Design**: Building apps with privacy as a core consideration
4. **Foldable Device Support**: Adapting to new form factors

The future looks bright for mobile developers who stay updated with these emerging trends and technologies.`,
      category: 'Technology',
      date: '2024-01-15',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400',
      author: 'Sarah Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
      authorRole: 'Senior Mobile Developer',
      likes: 42,
      comments: 8,
      tags: ['React Native', 'Mobile', 'Technology', '2024'],
    },
    {
      id: '2',
      title: 'UX Design Principles for Modern Apps',
      excerpt: 'Essential design principles that every developer should know for creating intuitive user experiences.',
      content: `User experience design is crucial for the success of any mobile application. In this comprehensive guide, we'll explore the fundamental principles that make apps intuitive and enjoyable to use.

## Understanding User Needs

The first step in creating a great UX is understanding your users. Conduct user research, create personas, and map user journeys to identify pain points and opportunities.

### Core Design Principles

- **Simplicity**: Keep interfaces clean and focused
- **Consistency**: Maintain visual and interaction patterns
- **Feedback**: Provide clear responses to user actions
- **Accessibility**: Ensure apps are usable by everyone

By following these principles, you can create apps that users love and keep coming back to.`,
      category: 'Design',
      date: '2024-01-12',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400',
      author: 'Marcus Johnson',
      authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      authorRole: 'Lead UX Designer',
      likes: 31,
      comments: 5,
      tags: ['UX Design', 'UI', 'User Experience', 'Design Systems'],
    },
    {
      id: '3',
      title: 'Building Scalable React Native Apps',
      excerpt: 'Best practices and architecture patterns for building scalable and maintainable React Native applications.',
      content: `Building scalable React Native applications requires careful planning and architecture decisions. In this article, we'll explore patterns and practices that help your app grow without becoming unmaintainable.

## Architecture Patterns

### Component-Based Architecture

Organize your code into reusable, focused components that follow the single responsibility principle.

### State Management

Choose the right state management solution based on your app's complexity:
- **Context API** for simple state
- **Redux** for complex state management
- **Zustand** for lightweight solutions

### Performance Optimization

Implement lazy loading, memoization, and efficient re-rendering strategies to keep your app performant as it grows.`,
      category: 'Development',
      date: '2024-01-10',
      readTime: '10 min read',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
      author: 'Alex Rodriguez',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      authorRole: 'React Native Expert',
      likes: 56,
      comments: 12,
      tags: ['React Native', 'Architecture', 'Scalability', 'Performance'],
    },
  ];

  const categories = ['All', 'Technology', 'Design', 'Development', 'AI', 'Business'];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    // Simulate API call
    setRefreshing(true);
    setTimeout(() => {
      setPosts(blogPosts);
      setRefreshing(false);
    }, 1000);
  };

  // const handlePostPress = (post) => {
  //   navigation.navigate('blogDetail', { post });
  // };

  const handlePostPress = (post) => {
    console.log('Post pressed:', post.title); // Debug log
    if (onNavigateToBlogDetail && typeof onNavigateToBlogDetail === 'function') {
      onNavigateToBlogDetail(post);
    } else {
      console.error('onNavigateToBlogDetail is not a function or is undefined');
      console.log('onNavigateToBlogDetail value:', onNavigateToBlogDetail);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPostItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => handlePostPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.postImage} />
      <View style={styles.postContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postExcerpt}>{item.excerpt}</Text>
        
        <View style={styles.postMeta}>
          <View style={styles.authorInfo}>
            <Image source={{ uri: item.authorAvatar }} style={styles.avatar} />
            <Text style={styles.authorName}>{item.author}</Text>
          </View>
          <Text style={styles.postDate}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.readTime}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item && styles.categoryChipActive
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item && styles.categoryChipTextActive
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Blog</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Posts List */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPosts}
            colors={['#007AFF']}
          />
        }
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No articles found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    margin: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  postContent: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 24,
  },
  postExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default BlogScreen;