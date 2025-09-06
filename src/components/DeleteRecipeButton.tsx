'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteRecipeButtonProps {
  recipeId: string;
}

export default function DeleteRecipeButton({ recipeId }: DeleteRecipeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete recipe');
      }

      router.refresh(); // Refresh the page to update the list
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete recipe. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  function handleCancel() {
    setShowConfirm(false);
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 text-xs font-medium"
        >
          {isDeleting ? '...' : 'Delete'}
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-gray-500 hover:text-gray-700 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
      title="Delete recipe"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
