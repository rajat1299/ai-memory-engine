import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trash2, RefreshCw, Star, Loader2, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../lib/store';

const categoryColors = {
  preference: 'bg-blue-100 text-blue-700 border-blue-200',
  personal_info: 'bg-purple-100 text-purple-700 border-purple-200',
  work: 'bg-green-100 text-green-700 border-green-200',
  relationship: 'bg-pink-100 text-pink-700 border-pink-200',
  health: 'bg-red-100 text-red-100 border-red-200',
  interest: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  goal: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  default: 'bg-muted text-muted-foreground border-border',
};

const ITEMS_PER_PAGE = 6;

const FactsPanel = () => {
  const { facts, loadFacts, deleteFact, isLoading } = useStore();

  // State for filtering, sorting, and pagination
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'confidence_high', 'confidence_low'
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'filter', 'sort', or null

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  // Close dropdowns when clicking outside (simple implementation)
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const getCategoryColor = (category) => {
    const key = category?.toLowerCase().replace(/\s+/g, '_');
    return categoryColors[key] || categoryColors.default;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Derived state: Filtered and Sorted Facts
  const processedFacts = useMemo(() => {
    let result = [...facts];

    // 1. Filter
    if (filterCategory !== 'all') {
      result = result.filter(f => f.category === filterCategory);
    }

    // 2. Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'confidence_high':
          return b.confidence - a.confidence;
        case 'confidence_low':
          return a.confidence - b.confidence;
        default:
          return 0;
      }
    });

    return result;
  }, [facts, filterCategory, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(processedFacts.length / ITEMS_PER_PAGE);
  const paginatedFacts = processedFacts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, sortOrder]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(facts.map(f => f.category));
    return ['all', ...Array.from(cats)];
  }, [facts]);

  const handleDropdownClick = (e, type) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === type ? null : type);
  };

  return (
    <div className="min-h-[500px]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold mb-2">Extracted Facts</h2>
          <p className="text-muted-foreground font-body text-sm">
            Facts automatically extracted from your conversations.
          </p>
        </div>

        {/* Control Pill */}
        <div className="flex items-center bg-card border border-border rounded-full shadow-sm p-1 self-start sm:self-auto relative z-20">

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={(e) => handleDropdownClick(e, 'filter')}
              className={`p-2 rounded-full transition-colors ${activeDropdown === 'filter' ? 'bg-muted text-text' : 'text-muted-foreground hover:text-text hover:bg-muted/50'}`}
              title="Filter by Category"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Filter Dropdown */}
            <AnimatePresence>
              {activeDropdown === 'filter' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Filter by Category
                    </div>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setFilterCategory(cat);
                          setActiveDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center justify-between group"
                      >
                        <span className={`capitalize ${filterCategory === cat ? 'text-text font-medium' : 'text-muted-foreground group-hover:text-text'}`}>
                          {cat}
                        </span>
                        {filterCategory === cat && <Check className="w-3 h-3 text-accent" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={(e) => handleDropdownClick(e, 'sort')}
              className={`p-2 rounded-full transition-colors ${activeDropdown === 'sort' ? 'bg-muted text-text' : 'text-muted-foreground hover:text-text hover:bg-muted/50'}`}
              title="Sort Facts"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Sort Dropdown */}
            <AnimatePresence>
              {activeDropdown === 'sort' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Sort Order
                    </div>
                    {[
                      { id: 'newest', label: 'Newest First' },
                      { id: 'oldest', label: 'Oldest First' },
                      { id: 'confidence_high', label: 'Highest Confidence' },
                      { id: 'confidence_low', label: 'Lowest Confidence' },
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortOrder(option.id);
                          setActiveDropdown(null);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center justify-between group"
                      >
                        <span className={`${sortOrder === option.id ? 'text-text font-medium' : 'text-muted-foreground group-hover:text-text'}`}>
                          {option.label}
                        </span>
                        {sortOrder === option.id && <Check className="w-3 h-3 text-accent" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Refresh Button */}
          <button
            onClick={() => loadFacts()}
            disabled={isLoading}
            className="p-2 rounded-full text-muted-foreground hover:text-text hover:bg-muted/50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Facts Grid */}
      {processedFacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-medium mb-2">No Facts Found</h3>
          <p className="text-sm text-muted-foreground font-body max-w-sm">
            {facts.length === 0
              ? "Start chatting to have facts automatically extracted and remembered."
              : "Try adjusting your filters to see more results."}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <AnimatePresence mode="popLayout">
              {paginatedFacts.map((fact) => (
                <motion.div
                  key={fact.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative p-4 bg-card rounded-xl border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all"
                >
                  {/* Essential Badge */}
                  {fact.is_essential && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className={`inline-flex px-2 py-1 rounded-md text-xs font-body border ${getCategoryColor(fact.category)} mb-3`}>
                    {fact.category}
                  </div>

                  {/* Content */}
                  <p className="text-sm font-body text-text leading-relaxed mb-3">
                    {fact.content}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-1">
                        {Math.round(fact.confidence * 100)}% confidence
                      </span>
                      <span>•</span>
                      <span>{formatDate(fact.created_at)}</span>
                    </div>

                    <button
                      onClick={() => deleteFact(fact.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
                      title="Delete fact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-text" />
              </button>

              <span className="text-sm font-body text-muted-foreground">
                Page <span className="text-text font-medium">{currentPage}</span> of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-text" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Loading State Overlay */}
      {isLoading && facts.length > 0 && (
        <div className="absolute inset-0 bg-bg/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      )}
    </div>
  );
};

export default FactsPanel;

