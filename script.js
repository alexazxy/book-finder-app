// Get DOM elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');

// Add event listener for form submission
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) return;
    
    // Clear previous results
    resultsDiv.innerHTML = '<p>Searching...</p>';
    
    try {
        // Make API request to Open Library
        const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.docs.length === 0) {
            resultsDiv.innerHTML = '<p>No books found. Try another search.</p>';
            return;
        }
        
        // Display results
        resultsDiv.innerHTML = data.docs.slice(0, 10).map(book => `
            <div class="book-card">
                <img src="${book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'placeholder.jpg'}" 
                     alt="Book cover" 
                     class="book-cover">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>Author: ${book.author_name ? book.author_name.join(', ') : 'Unknown'}</p>
                    <p>First published: ${book.first_publish_year || 'N/A'}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        resultsDiv.innerHTML = '<p>An error occurred while searching. Please try again later.</p>';
        console.error('Search error:', error);
    }
});