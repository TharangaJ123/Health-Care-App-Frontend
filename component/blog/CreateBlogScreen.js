import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../config/api';
import { useUser } from '../../context/UserContext';

const CreateBlogScreen = ({ onCreated, onCancel, initial, onUpdated }) => {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [readTime, setReadTime] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorRole, setAuthorRole] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [likes, setLikes] = useState('0');
  const [comments, setComments] = useState('0');
  const [helpfulCount, setHelpfulCount] = useState('0');
  const [isVerified, setIsVerified] = useState(false);
  const [categoryColor, setCategoryColor] = useState('#4CAF50');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Daily Med Tips', 'Side Effects Stories', 'Success Journeys', 'Ask the Community', 'Professional Advice', 'General'];
  const colorOptions = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#2E8B57', '#FFC107', '#00BCD4'];

  // Prefill when editing
  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setAuthor(initial.isAnonymous ? '' : (initial.author || ''));
      setCategory(initial.category || 'General');
      setExcerpt(initial.excerpt || '');
      setContent(initial.content || '');
      setTags(Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || ''));
      setReadTime(initial.readTime || '');
      setIsAnonymous(Boolean(initial.isAnonymous));
      setAuthorRole(initial.authorRole || '');
      setDate(initial.date || new Date().toISOString().split('T')[0]);
      setIsVerified(Boolean(initial.isVerified));
      setCategoryColor(initial.categoryColor || '#4CAF50');
    }
  }, [initial]);

  const validate = () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      Alert.alert('Missing fields', 'Title, Excerpt and Content are required.');
      return false;
    }
    if (!isAnonymous && !author.trim()) {
      Alert.alert('Missing fields', 'Author is required unless posting anonymously.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        id: initial?.id || Date.now().toString(),
        title,
        excerpt,
        content,
        category,
        date,
        readTime,
        author: isAnonymous ? 'Anonymous' : author,
        authorRole,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        tags,
        isVerified,
        helpfulCount: Number(helpfulCount) || 0,
        categoryColor,
        userId: user?.uid || user?.email || undefined,
      };
      if (initial?.id) {
        const updated = await apiFetch(`/api/blogs/${initial.id}?userId=${encodeURIComponent(user?.uid || user?.email || '')}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        Alert.alert('Success', 'Blog post updated');
        onUpdated && onUpdated(updated);
      } else {
        const created = await apiFetch('/api/blogs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Alert.alert('Success', 'Blog post created');
        onCreated && onCreated(created);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to create blog');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={onCancel}>
          <Ionicons name="chevron-back" size={24} color="#000000ff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Create Your Story</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      {/* Author, Role & Anonymous Toggle */}
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <TextInput style={styles.input} placeholder="Author" value={author} onChangeText={setAuthor} editable={!isAnonymous} />
        </View>
        <View style={styles.switchWrap}>
          <Text style={styles.switchLabel}>Anonymous</Text>
          <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ false: '#E5E7EB', true: '#34C759' }} />
        </View>
      </View>
      <TextInput style={styles.input} placeholder="Author role (e.g., Asthma Patient)" value={authorRole} onChangeText={setAuthorRole} />

      {/* Category Chips */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Category</Text>
      </View>
      <View style={styles.chipsRow}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Tags (comma separated)" value={tags} onChangeText={setTags} />
      <TextInput style={[styles.input, styles.textArea]} multiline placeholder="Excerpt" value={excerpt} onChangeText={setExcerpt} />
      <TextInput style={[styles.input, styles.textArea]} multiline placeholder="Content (markdown/plain)" value={content} onChangeText={setContent} />
      <TextInput style={styles.input} placeholder="Read time (e.g. 5 min read)" value={readTime} onChangeText={setReadTime} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />

      {/* Category Color Picker */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Category Color</Text>
      </View>
      <View style={styles.colorSelector}>
        <TouchableOpacity style={styles.colorSelectorValue} onPress={() => setShowColorPicker(!showColorPicker)}>
          <View style={[styles.colorSwatch, { backgroundColor: categoryColor }]} />
          <Text style={styles.colorSelectorText}>{categoryColor}</Text>
          <Ionicons name={showColorPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
        </TouchableOpacity>
        {showColorPicker && (
          <View style={styles.colorDropdown}>
            {colorOptions.map((c) => (
              <TouchableOpacity key={c} style={styles.colorOption} onPress={() => { setCategoryColor(c); setShowColorPicker(false); }}>
                <View style={[styles.colorOptionSwatch, { backgroundColor: c }]} />
                <Text style={styles.colorOptionLabel}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.rowBetween, { alignItems: 'center' }]}>
        <Text style={styles.switchLabel}>Verified</Text>
        <Switch value={isVerified} onValueChange={setIsVerified} trackColor={{ false: '#E5E7EB', true: '#34C759' }} />
      </View>

      {/* Image inputs removed */}

      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel} disabled={submitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.primaryText}>
            {initial?.id ? (submitting ? 'Saving...' : 'Save') : (submitting ? 'Submitting...' : 'Create')}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 30, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: '#111' },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontWeight: '800',
    fontSize: 20,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 6,
    color: '#2c5ba0ff',
    fontWeight: '600',
    fontSize: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRightText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sectionHeader: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchWrap: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginRight: 8, color: '#333', fontWeight: '600' },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  primary: { backgroundColor: '#007AFF', flex: 1, marginLeft: 8, justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '600', textAlign: 'center', width: '100%' },
  cancel: { backgroundColor: '#ffecec', flex: 1, marginRight: 8, justifyContent: 'center' },
  cancelText: { color: '#ff3b30', fontWeight: '600', textAlign: 'center', width: '100%' },
  
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#f0f0f0', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { color: '#333', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  colorSelector: { marginBottom: 12 },
  colorSelectorValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fafafa' },
  colorSelectorText: { color: '#333', fontWeight: '600', marginRight: 8, flex: 1, marginLeft: 10 },
  colorSwatch: { width: 20, height: 20, borderRadius: 6 },
  colorDropdown: { marginTop: 8, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  colorOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  colorOptionSwatch: { width: 18, height: 18, borderRadius: 5, marginRight: 10 },
  colorOptionLabel: { color: '#333', fontWeight: '600' },
});

export default CreateBlogScreen;
