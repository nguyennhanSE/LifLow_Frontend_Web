'use client'

import { use } from 'react'
import { RecipePostCard } from "../components/RecipePostCard";

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    return (
        <RecipePostCard id={resolvedParams.id} />
    )
}