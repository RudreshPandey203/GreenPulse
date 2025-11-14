// src/components/BlogSection.js
'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from './BlogSection.module.css';

const CreateBlogPostForm = ({ user }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setMessage('Please fill in both title and content.');
            return;
        }
        if (!user) {
            setMessage('You must be logged in to post.');
            return;
        }

        setIsSubmitting(true);
        setMessage('');

        try {
            await addDoc(collection(db, 'blogs'), {
                title: title.trim(),
                content: content.trim(),
                authorName: user.displayName || 'Anonymous',
                authorId: user.uid,
                createdAt: serverTimestamp(),
            });
            setTitle('');
            setContent('');
            setMessage('Blog post added successfully!');
            setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
        } catch (error) {
            console.error('Error adding blog post:', error);
            setMessage('Failed to add blog post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.blogForm}>
            <h3>Create a New Blog Post</h3>
            <div className={styles.formGroup}>
                <label htmlFor="blogTitle">Title</label>
                <input
                    type="text"
                    id="blogTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="blogContent">Content</label>
                <textarea
                    id="blogContent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="6"
                    required
                />
            </div>
            {message && <p className={message.startsWith('Failed') ? styles.errorMessage : styles.successMessage}>{message}</p>}
            <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
                {isSubmitting ? 'Posting...' : 'Post Blog'}
            </button>
        </form>
    );
};

const BlogSection = ({ user }) => {
    const [blogPosts, setBlogPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamp to readable date string or Date object
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString() : 'Date unavailable'
            }));
            setBlogPosts(posts);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching blog posts:", err);
            setError("Failed to load blog posts.");
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <div className={styles.blogSection}>
            <h2>Community Blog</h2>
            {user && <CreateBlogPostForm user={user} />}

            <h3 className={styles.postsHeader}>Recent Posts</h3>
            {loading && <p>Loading blog posts...</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
            {!loading && !error && blogPosts.length === 0 && <p>No blog posts yet. Be the first to write one!</p>}

            {!loading && !error && blogPosts.length > 0 && (
                <div className={styles.blogList}>
                    {blogPosts.map(post => (
                        <div key={post.id} className={styles.blogPost}>
                            <h4>{post.title}</h4>
                            <p className={styles.blogMeta}>By {post.authorName} on {post.createdAt}</p>
                            {/* Display only a snippet or the full content */}
                            <p className={styles.blogContentSnippet}>
                                {post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}
                            </p>
                            {/* Add a 'Read More' link if needed */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogSection;
