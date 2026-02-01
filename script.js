/**
 * Political Blog - Core Logic
 * Handles localStorage, DOM manipulation, and page specific logic.
 */

// Constants
const STORAGE_KEY = 'politics_blog_data';
const DEFAULT_CATEGORIES = ['Politics', 'Policy', 'Election', 'Opinion'];

// Default Data (if empty)
const SEED_DATA = [
    {
        id: '1',
        title: 'The Future of Digital Democracy',
        description: 'As technology evolves, so does the way we participate in our democracy. Digital voting, online town halls, and AI-driven policy analysis are becoming realities. This post explores the potential benefits and risks of this digital transformation in the political landscape.',
        date: '2023-10-15',
        category: 'Politics',
        image: null // Placeholder handled in UI
    },
    {
        id: '17282719281',
        title: 'Policy Changes in 2024',
        description: 'A deep dive into the new economic policies proposed for the upcoming fiscal year. We analyze the impact on small businesses, international trade relationships, and the average consumer. What do these changes really mean for the economy?',
        date: '2024-01-20',
        category: 'Policy',
        image: null
    }
];

// App State
const state = {
    blogs: [],
    categories: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
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

// --- Data Management ---
function loadData() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
        const parsed = JSON.parse(rawData);
        state.blogs = parsed.blogs || [];
        state.categories = parsed.categories || DEFAULT_CATEGORIES;
    } else {
        // Seed initial data
        state.blogs = SEED_DATA;
        state.categories = DEFAULT_CATEGORIES;
        saveData();
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('Storage limit exceeded! Image might be too large. Try a smaller image.');
        } else {
            console.error('Error saving data:', e);
            alert('Error saving data. See console for details.');
        }
        return false;
    }
}

// --- Routing / Page Logic ---
function initRouter() {
    const path = window.location.pathname;
    const page = path.split('/').pop();

    if (page === 'index.html' || page === '') {
        renderHomePage();
    } else if (page === 'add-blog.html') {
        initAddBlogPage();
    } else if (page === 'blog.html') {
        renderSingleBlogPage();
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

    // Sort by date new to old
    const sortedBlogs = [...state.blogs].sort((a, b) => new Date(b.date) - new Date(a.date));

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
    article.onclick = () => window.location.href = `blog.html?id=${blog.id}`;

    // Image handling
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

    // Populate Categories
    renderCategoryOptions(categorySelect);

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

    // Handle Category "Other/New"
    // For simplicity, we just have a text input that overrides select if filled

    // Form Submit
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value; // YYYY-MM-DD
        let category = newCategoryInput.value.trim() || categorySelect.value;

        // Handle Image
        const file = imageInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                saveNewBlog(title, description, date, category, event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            saveNewBlog(title, description, date, category, null);
        }
    });
}

function renderCategoryOptions(selectElement) {
    selectElement.innerHTML = '';
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectElement.appendChild(option);
    });
}

function saveNewBlog(title, description, date, category, imageBase64) {
    const newBlog = {
        id: Date.now().toString(),
        title,
        description,
        date,
        category,
        image: imageBase64
    };

    // Update state
    state.blogs.push(newBlog);

    // Add category if new
    if (!state.categories.includes(category)) {
        state.categories.push(category);
    }

    saveData();

    // Redirect
    window.location.href = 'index.html';
}

// --- Single Blog Page Logic ---
function renderSingleBlogPage() {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get('id');
    const container = document.getElementById('blogContainer');

    if (!blogId || !container) return;

    const blog = state.blogs.find(b => b.id === blogId);

    if (!blog) {
        container.innerHTML = '<h2>Blog not found</h2><a href="index.html" class="btn-primary">Go Home</a>';
        return;
    }

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
    // Simple newline to paragraph conversion for displaying blog text
    return text.split('\n').map(p => `<p>${p}</p>`).join('');
}
