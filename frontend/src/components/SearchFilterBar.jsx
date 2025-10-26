import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SearchFilterBar = ({
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  allTags = [],
  selectedTags = [],
  onToggleTag,
  onClearAllTags
}) => {
  return (
    <div className="space-y-4">
      {/* Main Search and Filters Row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40"
            size={20}
          />
          <input
            id="search-input"
            type="text"
            placeholder="Search by title, tags, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full lg:w-48 px-4 py-3 bg-white/5 border border-white/10 text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem'
            }}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full lg:w-48 px-4 py-3 bg-white/5 border border-white/10 text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem'
            }}
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Viewed</option>
            <option value="liked">Most Liked</option>
            <option value="title">Title (A-Z)</option>
            <option value="duration">Duration</option>
          </select>
        </div>

        {/* Reset Button */}
        {(searchQuery || selectedCategory !== 'All' || sortBy !== 'latest' || selectedTags.length > 0) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSortBy('latest');
              onClearAllTags();
            }}
            className="px-6 py-3 bg-white/5 border border-white/10 text-white/70 hover:bg-red-600/20 hover:border-red-500/30 hover:text-red-300 transition-all flex items-center gap-2 justify-center whitespace-nowrap"
          >
            <X size={18} />
            Reset
          </button>
        )}
      </div>

      {/* Tag Pills Row */}
      {allTags.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-white/40" />
              <span className="text-xs text-white/60 uppercase tracking-wider font-medium">
                Filter by Tags
              </span>
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={onClearAllTags}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider font-medium"
              >
                Clear Tags ({selectedTags.length})
              </button>
            )}
          </div>

          {/* Tags Container with horizontal scroll */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {allTags.slice(0, 30).map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-purple-600/20 hover:border-purple-500/30 hover:text-purple-300'
                  }`}
                >
                  #{tag}
                  {isSelected && <X size={12} className="inline ml-1" />}
                </button>
              );
            })}
            {allTags.length > 30 && (
              <span className="px-3 py-1.5 text-xs text-white/40 italic">
                +{allTags.length - 30} more tags
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;