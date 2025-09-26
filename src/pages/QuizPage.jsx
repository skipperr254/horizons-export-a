import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import QuizQuestion from '@/components/quiz/QuizQuestion';
import QuizResult from '@/components/quiz/QuizResult';
import { Loader2 } from 'lucide-react';
import Seo from '@/components/Seo';
import { Howl } from 'howler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TIME_PER_QUESTION = 15;
const NEXT_QUESTION_DELAY = 500; // 0.5 seconds

const sounds = {
    correct: new Howl({ src: ['/sounds/correct.mp3'], volume: 0.3, preload: true }),
    wrong: new Howl({ src: ['/sounds/wrong.mp3'], volume: 0.3, preload: true }),
    excitement: new Howl({ src: ['/sounds/excitement.mp3'], volume: 0.5, preload: true }),
};

const QuizPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [quizFinished, setQuizFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    const nextQuestionTimerRef = useRef(null);
    const intervalRef = useRef(null);

    const handleNextQuestion = useCallback(() => {
        if (nextQuestionTimerRef.current) {
            clearTimeout(nextQuestionTimerRef.current);
            nextQuestionTimerRef.current = null;
        }

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setQuizFinished(true);
            sounds.excitement.play();
        }
    }, [currentQuestionIndex, questions.length]);

    const handleAnswer = useCallback((answer) => {
        if (isAnswered) return;

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        stopTimer();
        const isCorrect = answer === currentQuestion.correctAnswer;
        setSelectedAnswer(answer);
        setIsAnswered(true);

        if (isCorrect) {
            setScore(s => s + 1);
            setStreak(s => s + 1);
            sounds.correct.play();
        } else {
            setStreak(0);
            sounds.wrong.play();
        }

        nextQuestionTimerRef.current = setTimeout(handleNextQuestion, NEXT_QUESTION_DELAY);
    }, [isAnswered, questions, currentQuestionIndex, handleNextQuestion]);

    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        stopTimer();
        setTimeLeft(TIME_PER_QUESTION);
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer();
                    handleAnswer(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [stopTimer, handleAnswer]);

    useEffect(() => {
        if (location.state?.words && location.state?.allWords) {
            const generatedQuestions = location.state.words.map(correctWord => {
                const wrongOptions = [...location.state.allWords]
                    .filter(w => w.id !== correctWord.id)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3)
                    .map(w => w.translation);
                
                const options = [...wrongOptions, correctWord.translation].sort(() => 0.5 - Math.random());
                
                return {
                    word: correctWord.word,
                    correctAnswer: correctWord.translation,
                    options: options,
                    originalWord: correctWord
                };
            });
            setQuestions(generatedQuestions);
            setLoading(false);
        } else {
            navigate('/quiz/setup');
        }
    }, [location.state, navigate]);

     useEffect(() => {
        if (!loading && !quizFinished && !isAnswered) {
            startTimer();
        } else {
            stopTimer();
        }
        return stopTimer;
    }, [loading, currentQuestionIndex, quizFinished, isAnswered, startTimer, stopTimer]);

    const saveAttempt = useCallback(async () => {
        if (!user) return;
        try {
            const { error } = await supabase.from('user_quiz_attempts').insert({
                user_id: user.id,
                score: score,
                total_questions: questions.length,
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error saving quiz attempt:', error);
            toast({
                title: 'Hata',
                description: 'Quiz sonucu kaydedilemedi.',
                variant: 'destructive',
            });
        }
    }, [user, score, questions.length, toast]);

    useEffect(() => {
        if (quizFinished) {
            saveAttempt();
        }
    }, [quizFinished, saveAttempt]);
    
    useEffect(() => {
        return () => {
            if (nextQuestionTimerRef.current) {
                clearTimeout(nextQuestionTimerRef.current);
            }
            stopTimer();
        };
    }, [stopTimer]);

    const handleRestart = () => {
        navigate('/quiz/setup');
    };

    const handleExit = useCallback(() => {
        setShowExitConfirm(true);
    }, []);

    const confirmExit = () => {
        navigate('/activities');
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const currentQuestion = questions[currentQuestionIndex];

    return (
        <>
            <Seo title="Quiz" description="Bilginizi test edin!" />
            <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {!quizFinished && currentQuestion ? (
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, y: 30, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <QuizQuestion
                                question={currentQuestion}
                                onAnswerSelect={handleAnswer}
                                isAnswered={isAnswered}
                                selectedAnswer={selectedAnswer}
                                timeLeft={timeLeft}
                                score={score}
                                streak={streak}
                                currentQuestionIndex={currentQuestionIndex}
                                totalQuestions={questions.length}
                                onNextQuestion={handleNextQuestion}
                                onExit={handleExit}
                            />
                        </motion.div>
                    ) : (
                        <QuizResult
                            score={score}
                            totalQuestions={questions.length}
                            onRestart={handleRestart}
                            onBackToActivities={confirmExit}
                        />
                    )}
                </AnimatePresence>
            </div>
            <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Quiz'den ayrılmak istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Mevcut ilerlemeniz kaydedilmeyecek. Yine de devam etmek istiyor musunuz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmExit} className="bg-destructive hover:bg-destructive/90">Ayrıl</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default QuizPage;