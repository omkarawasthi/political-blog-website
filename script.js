/**
 * Political Blog - Core Logic
 * Handles API interactions, DOM manipulation, and page specific logic.
 */

// Constants
const API_URL = 'https://political-blog-website-backend.onrender.com/api/blogs';
const DEFAULT_CATEGORIES = ['Politics', 'Policy', 'Election', 'Opinion'];

// App State
const state = {
    blogs: [],
    categories: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchBlogs();
    initRouter();
    setupMobileMenu();
});

function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// --- Data Management (API) ---
async function fetchBlogs() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        state.blogs = data || [];

        // Extract Unique Categories from fetched blogs + Defaults
        const usedCategories = state.blogs.map(b => b.category);
        state.categories = [...new Set([...DEFAULT_CATEGORIES, ...usedCategories])];

        // Re-render if on homepage
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
            renderHomePage();
        }
    } catch (error) {
        console.error('Error fetching blogs:', error);
        // Only alert if we really can't get data, maybe show UI error instead
        const grid = document.getElementById('blogGrid');
        if (grid) {
            grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1; color: red;">Failed to load blogs. Ensure backend server is running.</p>';
        }
    }
}

// --- Routing / Page Logic ---
function initRouter() {
    const path = window.location.pathname;
    const page = path.split('/').pop();

    if (page === 'index.html' || page === '') {
        // Render happens after fetch
    } else if (page === 'add-blog.html') {
        initAddBlogPage();
    } else if (page === 'blog.html') {
        fetchSingleBlog();
    }

    // Global Header Highlight
    highlightActiveLink();
}

function highlightActiveLink() {
    const links = document.querySelectorAll('.nav-link');
    const path = window.location.pathname.split('/').pop() || 'index.html';

    links.forEach(link => {
        if (link.getAttribute('href') === path) {
            link.style.color = 'var(--primary-color)';
            link.style.fontWeight = '700';
        }
    });
}

// --- Homepage Logic ---
function renderHomePage() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear

    const sortedBlogs = [...state.blogs]; // Backend usually returns sorted, but good to ensure

    if (sortedBlogs.length === 0) {
        grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No blogs found. Start by adding one!</p>';
        return;
    }

    sortedBlogs.forEach(blog => {
        const card = createBlogCard(blog);
        grid.appendChild(card);
    });
}

function createBlogCard(blog) {
    const article = document.createElement('article');
    article.className = 'blog-card';
    // Use _id for MongoDB documents
    article.onclick = () => window.location.href = `blog.html?id=${blog._id}`;

    // Image handling - use default if null
    const imgSrc = blog.image ? blog.image : 'https://placehold.co/600x400/1a3c6e/ffffff?text=Political+Blog';

    article.innerHTML = `
        <img src="${imgSrc}" alt="${blog.title}" class="blog-image">
        <div class="blog-content">
            <div class="blog-meta">
                <span>${blog.category}</span>
                <span>${formatDate(blog.date)}</span>
            </div>
            <h3 class="blog-title">${blog.title}</h3>
            <p class="blog-excerpt">${blog.description}</p>
            <div class="read-more">
                Read Article <span style="margin-left: 5px;">→</span>
            </div>
        </div>
    `;
    return article;
}

// --- Add Blog Page Logic ---
function initAddBlogPage() {
    const form = document.getElementById('addBlogForm');
    const categorySelect = document.getElementById('category');
    const newCategoryInput = document.getElementById('newCategory');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');

    if (!form) return;

    // Populate Categories - Wait a bit for fetch or just render defaults immediately
    setTimeout(() => renderCategoryOptions(categorySelect), 500);

    // Image Preview
    imageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Form Submit
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        let category = newCategoryInput.value.trim() || categorySelect.value;
        const file = imageInput.files[0];

        // Create FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date);
        formData.append('category', category);
        if (file) {
            formData.append('image', file);
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Blog published successfully to database!');
                window.location.href = 'index.html';
            } else {
                const err = await response.json();
                alert('Error publishing blog: ' + err.message);
            }
        } catch (error) {
            console.error(error);
            alert('Server error. Check if backend is running.');
        }
    });
}

function renderCategoryOptions(selectElement) {
    if (!selectElement) return;

    selectElement.innerHTML = '';
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectElement.appendChild(option);
    });
}

// --- Single Blog Page Logic ---
async function fetchSingleBlog() {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');
    const container = document.getElementById('blogContainer');

    if (!blogId || !container) return;

    try {
        const response = await fetch(`${API_URL}/${blogId}`);
        if (!response.ok) throw new Error('Blog not found');

        const blog = await response.json();
        renderSingleBlog(blog, container);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<h2>Blog not found</h2><a href="index.html" class="btn-primary">Go Home</a>';
    }
}

function renderSingleBlog(blog, container) {
    const imgSrc = blog.image ? blog.image : 'https://placehold.co/800x400/1a3c6e/ffffff?text=Political+Blog';

    // Populate DOM
    document.title = `${blog.title} - Political Blog`;

    container.innerHTML = `
        <article class="single-blog">
            <header class="single-blog-header">
                <div class="single-blog-meta">
                    <span class="badge">${blog.category}</span>
                    <span class="separator"> • </span>
                    <time>${formatDate(blog.date)}</time>
                </div>
                <h1>${blog.title}</h1>
            </header>
            
            <img src="${imgSrc}" alt="${blog.title}" class="single-blog-image">
            
            <div class="single-blog-content">
                ${formatContent(blog.description)}
            </div>
            
            <div style="margin-top: 3rem; text-align: center;">
                <a href="index.html" class="btn-primary">← Back to Blogs</a>
            </div>
        </article>
    `;
}

// --- Utilities ---
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatContent(text) {
    if (!text) return '';
    // Simple newline to paragraph conversion for displaying blog text
    return text.split('\n').map(p => `<p>${p}</p>`).join('');
}
