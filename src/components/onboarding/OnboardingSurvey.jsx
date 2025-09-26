import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Briefcase, GraduationCap, Plane, Brain, Compass, Wand2, Rocket, Fingerprint, Heart, ScrollText, PartyPopper, Drama, Swords, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const surveySteps = [
  {
    id: 'goal',
    title: 'İngilizce öğrenme hedefin nedir?',
    options: [
      { value: 'career', label: 'Kariyer', icon: Briefcase },
      { value: 'education', label: 'Eğitim', icon: GraduationCap },
      { value: 'travel', label: 'Seyahat', icon: Plane },
      { value: 'personal_growth', label: 'Kişisel Gelişim', icon: Brain },
    ],
    maxSelection: 1,
  },
  {
    id: 'level',
    title: 'İngilizce seviyen nedir?',
    options: [
      { value: 'a1', label: 'A1 - Yeni Başlıyorum' },
      { value: 'a2', label: 'A2 - Temelleri Biliyorum' },
      { value: 'b1', label: 'B1 - Orta Düzeydeyim' },
      { value: 'b2', label: 'B2 - Rahatça İletişim Kurarım' },
      { value: 'c1', label: 'C1 - Akıcı Konuşurum' },
    ],
    maxSelection: 1,
  },
  {
    id: 'genre',
    title: 'Hangi tür hikayeleri seversin?',
    subtitle: 'En fazla 3 tane seçebilirsin.',
    options: [
      { value: 'adventure', label: 'Macera', icon: Compass },
      { value: 'fantasy', label: 'Fantastik', icon: Wand2 },
      { value: 'sci-fi', label: 'Bilim Kurgu', icon: Rocket },
      { value: 'mystery', label: 'Gizem', icon: Fingerprint },
      { value: 'romance', label: 'Romantizm', icon: Heart },
      { value: 'history', label: 'Tarihi', icon: ScrollText },
      { value: 'comedy', label: 'Komedi', icon: PartyPopper },
      { value: 'drama', label: 'Dram', icon: Drama },
      { value: 'thriller', label: 'Gerilim', icon: Swords },
    ],
    maxSelection: 3,
  },
];

const OnboardingSurvey = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({ goal: null, level: null, genre: [] });
  const [direction, setDirection] = useState(1);
  const { toast } = useToast();

  const stepData = surveySteps[currentStep];

  const handleSelect = (stepId, value) => {
    if (stepData.maxSelection > 1) {
      setAnswers(prev => {
        const currentSelection = prev[stepId] || [];
        if (currentSelection.includes(value)) {
          return { ...prev, [stepId]: currentSelection.filter(item => item !== value) };
        }
        if (currentSelection.length < stepData.maxSelection) {
          return { ...prev, [stepId]: [...currentSelection, value] };
        }
        toast({
          title: "Limit Doldu!",
          description: `En fazla ${stepData.maxSelection} tür seçebilirsin.`,
          variant: "destructive",
        });
        return prev;
      });
    } else {
      setAnswers(prev => ({ ...prev, [stepId]: value }));
    }
  };

  const nextStep = () => {
    if (currentStep < surveySteps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / surveySteps.length) * 100;
  
  const selectedValue = answers[stepData.id];
  const isSelectionValid = Array.isArray(selectedValue) ? selectedValue.length > 0 : !!selectedValue;

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="w-full max-w-2xl mx-auto pt-4 sm:pt-8 px-4 sm:px-8">
        <div className="mb-8 text-center">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <Progress value={progress} className="h-2" />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-2">Adım {currentStep + 1} / {surveySteps.length}</p>
        </div>
      </div>

      <div className="flex-grow w-full max-w-2xl mx-auto flex items-center overflow-y-auto custom-scrollbar px-4 sm:px-8 pb-28">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="w-full"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2">{stepData.title}</h1>
            {stepData.subtitle && <p className="text-center text-muted-foreground mb-8 sm:mb-12">{stepData.subtitle}</p>}
            <div className={cn(
              "grid gap-3 sm:gap-4 mt-8",
              stepData.id === 'level' ? "grid-cols-1" : "grid-cols-2",
              stepData.id === 'genre' && "md:grid-cols-3"
            )}>
              {stepData.options.map(option => {
                const Icon = option.icon;
                const isSelected = Array.isArray(selectedValue) ? selectedValue.includes(option.value) : selectedValue === option.value;
                return (
                  <motion.div
                    key={option.value}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <button
                      onClick={() => handleSelect(stepData.id, option.value)}
                      className={cn(
                        "w-full p-4 sm:p-6 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4",
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-lg'
                          : 'bg-secondary/50 border-transparent hover:border-primary/50'
                      )}
                    >
                      {Icon && <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0", isSelected ? 'text-primary' : 'text-muted-foreground')} />}
                      <span className="font-semibold text-sm sm:text-base flex-grow">{option.label}</span>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border z-10">
        <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0} className={cn("transition-opacity", currentStep === 0 && "opacity-0 pointer-events-none")}>
              Geri
            </Button>
            <Button onClick={nextStep} disabled={!isSelectionValid} size="lg">
              {currentStep === surveySteps.length - 1 ? 'Bitir' : 'İleri'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSurvey;