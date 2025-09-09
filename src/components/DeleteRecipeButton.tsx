'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteRecipeButtonProps {
  recipeId: string;
}

export default function DeleteRecipeButton({ recipeId }: DeleteRecipeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    
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

  function handleCancel(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setShowConfirm(false);
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-lg p-1 shadow-lg">
        <Button
          onClick={(e) => handleDelete(e)}
          disabled={isDeleting}
          size="sm"
          variant="destructive"
          className="h-7 px-2 text-xs"
        >
          {isDeleting ? (
            <div className="w-3 h-3 animate-spin rounded-full border border-white border-t-transparent" />
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              Delete
            </>
          )}
        </Button>
        <Button
          onClick={(e) => handleCancel(e)}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={(e) => handleDelete(e)}
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground bg-background/80 backdrop-blur-sm border shadow-sm"
      title="Delete recipe"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
