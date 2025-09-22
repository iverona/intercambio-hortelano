"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TomatoRating } from "./TomatoRating";
import { CheckCircle, MessageSquare, Clock } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { useI18n } from "@/locales/provider";

export interface Review {
  rating: number;
  comment?: string;
  reviewerId: string;
  createdAt: Timestamp;
}

interface ReviewSectionProps {
  exchangeId: string;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  existingReviewByUser?: Review;
  existingReviewByPartner?: Review;
  onReviewSubmit: (rating: number, comment: string) => Promise<void>;
}

export function ReviewSection({
  exchangeId,
  currentUserId,
  partnerId,
  partnerName,
  partnerAvatar,
  existingReviewByUser,
  existingReviewByPartner,
  onReviewSubmit,
}: ReviewSectionProps) {
  const t = useI18n();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      return; // Don't submit without a rating
    }

    setIsSubmitting(true);
    try {
      await onReviewSubmit(rating, comment);
      setShowReviewForm(false);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Partner's review - Always show if it exists */}
      {existingReviewByPartner && (
        <Card className="p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={partnerAvatar} alt={partnerName} />
              <AvatarFallback>{partnerName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t('review_section.partner_review_title', { partnerName })}</h3>
                <span className="text-sm text-gray-500">
                  {existingReviewByPartner.createdAt?.toDate?.().toLocaleDateString() || ""}
                </span>
              </div>
              <TomatoRating rating={existingReviewByPartner.rating} size="sm" />
              {existingReviewByPartner.comment && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {existingReviewByPartner.comment}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* User's review or review form */}
      {existingReviewByUser ? (
        // Show the user's submitted review
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t('review_section.your_review_title')}</h3>
                <span className="text-sm text-gray-500">
                  {existingReviewByUser.createdAt?.toDate?.().toLocaleDateString() || ""}
                </span>
              </div>
              <TomatoRating rating={existingReviewByUser.rating} size="sm" />
              {existingReviewByUser.comment && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {existingReviewByUser.comment}
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : (
        // Show review form or prompt
        <>
          {!showReviewForm ? (
            <Card className="p-6 border-dashed border-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-3">
                  <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('review_section.share_experience_title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {t('review_section.share_experience_description', { partnerName })}
                </p>
                <Button onClick={() => setShowReviewForm(true)} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  {t('review_section.leave_review_button')}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('review_section.review_exchange_title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('review_section.review_exchange_description', { partnerName })}
                  </p>
                </div>

                <div>
                  <Label className="text-base mb-2 block">{t('review_section.rating_label')}</Label>
                  <TomatoRating
                    rating={rating}
                    interactive={true}
                    onRatingChange={setRating}
                    size="lg"
                  />
                  {rating === 0 && (
                    <p className="text-sm text-red-500 mt-1">{t('review_section.rating_error')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="comment" className="text-base mb-2 block">
                    {t('review_section.comment_label')}
                  </Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('review_section.comment_placeholder')}
                    className="resize-none"
                    rows={4}
                    maxLength={280}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {t('review_section.characters_remaining', { count: comment.length })}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? t('review_section.submitting_button') : t('review_section.submit_button')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                    disabled={isSubmitting}
                  >
                    {t('review_section.cancel_button')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Show waiting message if partner hasn't reviewed yet and user has */}
      {!existingReviewByPartner && existingReviewByUser && (
        <Card className="p-6 border-dashed bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 text-gray-500">
            <Clock className="w-5 h-5" />
            <p className="text-sm">{t('review_section.waiting_for_review', { partnerName })}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
