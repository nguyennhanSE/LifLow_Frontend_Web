"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Recipe } from "@/entities/recipes/recipe.entity";
import { User } from "@/entities/user.entity";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { Edit } from "lucide-react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next'


interface RecipeModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    recipeDetail: Recipe;
    author: User;
    deleteRecipe: () => void;
    activateRecipe: () => void;
    deactivateRecipe: () => void;
    correctRecipe: () => void;
}

export default function RecipeModal({ 
    open, 
    setOpen, 
    recipeDetail, 
    deleteRecipe,
    activateRecipe,
    deactivateRecipe,
    correctRecipe
  }: RecipeModalProps) {
    const { t } = useTranslation()
    const thumbnailSrc = Array.isArray(recipeDetail.thumbnailUrl)
      ? recipeDetail.thumbnailUrl[0]
      : recipeDetail.thumbnailUrl

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">{t('key176', '레시피 상세')}</DialogTitle>
              <button 
                onClick={() => setOpen(false)}
                title={t('close', 'Close')}
                className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
              </button>
            </div>
            <DialogDescription className="text-sm text-gray-500">
              {t('key177', '레시피 내용을 확인하고 활성화/비활성화 또는 삭제할 수 있습니다')}
            </DialogDescription>
          </DialogHeader>
  
          <div className="p-4 space-y-4">
            {/* Recipe Image */}
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={thumbnailSrc || ''} 
                alt={recipeDetail.title}
                className="w-full h-full object-cover"
              />
            </div>
  
            {/* Recipe Title */}
            <h3 className="font-medium text-base">{recipeDetail.title}</h3>
  
            {/* Recipe Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('key134', '작성자')}</p>
                <p className="text-sm font-medium">{recipeDetail.author?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('key111', '카테고리')}</p>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 text-xs px-2 py-0.5">
                  {t('key130', '레시피')}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('key178', '작성일')}</p>
                <p className="text-sm">
                  {recipeDetail.dateOfWriting 
                    ? format(new Date(recipeDetail.dateOfWriting), 'yyyy-MM-dd')
                    : recipeDetail.createdAt
                    ? format(new Date(recipeDetail.createdAt), 'yyyy-MM-dd')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('key179', '조회수')}</p>
                <p className="text-sm">{recipeDetail.views?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('key180', '상태')}</p>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs px-2 py-0.5">
                  {t('key181', '활성')}
                </Badge>
              </div>
            </div>
  
            {/* Detail Section */}
            <div>
              <p className="text-sm font-medium mb-2">{t('key135', '내용')}</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                {recipeDetail.content}
              </div>
            </div>
  
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {recipeDetail.status === 'active' ? (
                <Button 
                  variant="outline" 
                  className="flex-1 text-sm"
                  onClick={deactivateRecipe}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {t('key182', '비활성화')}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="flex-1 text-sm"
                  onClick={activateRecipe}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('key183', '활성화')}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="flex-1 text-sm"
                onClick={correctRecipe}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('key184', '수정')}
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 text-sm"
                onClick={deleteRecipe}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('key185', '삭제')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
