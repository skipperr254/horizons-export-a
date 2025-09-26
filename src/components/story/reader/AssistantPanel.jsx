import React, { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  Loader2,
  Volume2,
  Bookmark,
  BookmarkPlus,
  BookmarkCheck,
  Info,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Badge } from "@/components/ui/badge";

const AssistantPanel = forwardRef(
  (
    {
      isOpen,
      onClose,
      selectedWord,
      translationInfo,
      wordInfo,
      isTranslating,
      isFetchingInfo,
      infoError,
      onPronounce,
      onSaveWord,
      onMarkPosition,
      isWordSaved,
      isCheckingSaveStatus,
      isSavingWord,
      isPronouncingWord,
    },
    ref
  ) => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [panelHeight, setPanelHeight] = useState(60); // vh

    const handleDrag = (event, info) => {
      const delta = -info.delta.y;
      const deltaVh = (delta / window.innerHeight) * 100;
      let newHeight = panelHeight + deltaVh;
      newHeight = Math.max(30, Math.min(90, newHeight));
      setPanelHeight(newHeight);
    };

    const handleDragEnd = (event, info) => {
      if (info.offset.y > 150 && info.velocity.y > 20) {
        onClose();
      }
    };

    const mobileVariants = {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    };

    const desktopVariants = {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    };

    const variants = isMobile ? mobileVariants : desktopVariants;

    const isLoading = isTranslating || isFetchingInfo;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            data-assistant-panel
            key={isMobile ? "mobile-assistant" : "desktop-assistant"}
            variants={variants}
            initial='initial'
            animate='animate'
            exit='exit'
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={isMobile ? { height: `${panelHeight}vh` } : {}}
            className={
              isMobile
                ? "fixed bottom-0 left-0 right-0 w-full z-[60] touch-none"
                : "fixed top-0 right-0 h-full w-full max-w-sm z-[60]"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <Card
              className={
                isMobile
                  ? "h-full w-full rounded-t-2xl rounded-b-none shadow-2xl flex flex-col bg-background/90 backdrop-blur-lg relative overflow-hidden"
                  : "h-full w-full rounded-l-2xl rounded-r-none shadow-2xl flex flex-col bg-background/90 backdrop-blur-lg"
              }
            >
              {isMobile && (
                <motion.div
                  drag='y'
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  className='absolute top-0 left-0 right-0 h-6 flex justify-center items-start pt-3 cursor-row-resize z-20'
                >
                  <div className='w-10 h-1.5 bg-muted-foreground/50 rounded-full' />
                </motion.div>
              )}
              <CardHeader className='flex flex-row items-center justify-between p-4 border-b flex-shrink-0'>
                <CardTitle className='text-lg'>Yardımcı Asistan</CardTitle>
                <Button variant='ghost' size='icon' onClick={onClose}>
                  <X className='h-5 w-5' />
                </Button>
              </CardHeader>
              <CardContent className='p-6 flex-1 overflow-y-auto flex flex-col'>
                <div className='flex-grow'>
                  {selectedWord ? (
                    <div>
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className='text-2xl font-bold capitalize text-primary'>
                          {selectedWord}
                        </h3>
                        <Button
                          onClick={() => onPronounce(selectedWord)}
                          variant='ghost'
                          size='icon'
                          disabled={isPronouncingWord}
                          className='text-primary'
                        >
                          {isPronouncingWord ? (
                            <Loader2 className='h-5 w-5 animate-spin' />
                          ) : (
                            <Volume2 className='h-5 w-5' />
                          )}
                        </Button>
                      </div>

                      {isLoading ? (
                        <div className='flex items-center justify-center h-48'>
                          <Loader2 className='h-8 w-8 animate-spin text-primary' />
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          {translationInfo?.translation && (
                            <p className='text-xl font-semibold text-muted-foreground -mt-2 mb-4'>
                              {translationInfo.translation}
                            </p>
                          )}

                          {wordInfo && (
                            <div className='space-y-4'>
                              {wordInfo.canonical_form.base &&
                                wordInfo.word.toLowerCase() !==
                                wordInfo.canonical_form.base.toLowerCase() && (
                                  <p className='text-sm text-muted-foreground'>
                                    {/* Canonical Form:{" "} */}
                                    <span className='font-semibold'>
                                      {wordInfo.canonical_form.note}
                                    </span>
                                  </p>
                                )}
                              {wordInfo.senses?.map((sense, senseIdx) => (
                                <div
                                  key={senseIdx}
                                  className='space-y-3 p-4 bg-card rounded-lg shadow-sm border'
                                >
                                  <Badge
                                    variant='secondary'
                                    className='text-md px-3 py-1 mb-2 font-semibold'
                                  >
                                    {sense.part_of_speech}
                                  </Badge>
                                  {sense.meanings?.map(
                                    (meaning, meaningIdx) => (
                                      <div
                                        key={meaningIdx}
                                        className='space-y-2 mb-4 last:mb-0'
                                      >
                                        <p className='font-medium text-pretty leading-relaxed'>
                                          {meaningIdx + 1}. {meaning.definition}
                                        </p>
                                        {meaning.example_sentences &&
                                          meaning.example_sentences.length >
                                          0 && (
                                            <div className='space-y-1 mt-2'>
                                              <p className='text-sm font-semibold text-muted-foreground'>
                                                Examples:
                                              </p>
                                              <ul className='list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1'>
                                                {meaning.example_sentences.map(
                                                  (example, exIdx) => (
                                                    <li
                                                      key={exIdx}
                                                      className='italic'
                                                    >
                                                      "{example}"
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            </div>
                                          )}
                                        {meaning.synonyms &&
                                          meaning.synonyms.length > 0 && (
                                            <p className='text-sm text-muted-foreground'>
                                              Synonyms:{" "}
                                              <span className='font-medium'>
                                                {meaning.synonyms.join(", ")}
                                              </span>
                                            </p>
                                          )}
                                        {meaning.antonyms &&
                                          meaning.antonyms.length > 0 && (
                                            <p className='text-sm text-muted-foreground'>
                                              Antonyms:{" "}
                                              <span className='font-medium'>
                                                {meaning.antonyms.join(", ")}
                                              </span>
                                            </p>
                                          )}
                                      </div>
                                    )
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {infoError && !wordInfo && (
                            <div className='flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg'>
                              <Info className='h-4 w-4' />
                              <p>Kelime detayı alınamadı.</p>
                            </div>
                          )}

                          <div className='flex gap-2 pt-4'>
                            <Button
                              onClick={() =>
                                onSaveWord(
                                  selectedWord,
                                  translationInfo?.translation || ""
                                )
                              }
                              variant={isWordSaved ? "secondary" : "outline"}
                              className='flex-1'
                              disabled={
                                isCheckingSaveStatus ||
                                isSavingWord ||
                                isWordSaved
                              }
                            >
                              {isSavingWord || isCheckingSaveStatus ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              ) : isWordSaved ? (
                                <BookmarkCheck className='mr-2 h-4 w-4' />
                              ) : (
                                <Bookmark className='mr-2 h-4 w-4' />
                              )}
                              {isWordSaved ? "Kaydedildi" : "Kaydet"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='text-center text-muted-foreground pt-10'>
                      <p>
                        Bir kelime seçerek çevirisini ve telaffuzunu
                        öğrenebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
                {!isMobile && (
                  <div className='mt-4 pt-4 border-t'>
                    <Button
                      variant='outline'
                      className='w-full'
                      onClick={onMarkPosition}
                    >
                      <BookmarkPlus className='mr-2 h-4 w-4' />
                      Kaldığım yeri işaretle
                    </Button>
                  </div>
                )}
              </CardContent>
              {isMobile && (
                <div className='p-4 border-t flex-shrink-0'>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={onMarkPosition}
                  >
                    <BookmarkPlus className='mr-2 h-4 w-4' />
                    Kaldığım yeri işaretle
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

AssistantPanel.displayName = "AssistantPanel";

export default AssistantPanel;