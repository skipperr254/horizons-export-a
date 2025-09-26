import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, MoreHorizontal, ArrowRight, Crown, Edit2, Save, Goal, ArrowLeft, Settings, HelpCircle, PanelLeftOpen, PanelRightClose } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileCard = ({ isCollapsed, setCollapsed }) => {
  const { user, profile, canAccessPremiumFeatures } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { readStoryDetails, stories } = useDashboardData(user, navigate);
  
  const [isEditing, setIsEditing] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useLocalStorage('weeklyStoryGoal', 7);
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(weeklyGoal);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setTempWeeklyGoal(weeklyGoal);
  }, [isEditing, weeklyGoal]);

  const handleSaveGoal = () => {
    if (tempWeeklyGoal < 1 || tempWeeklyGoal > 300) {
      toast({ title: "Geçersiz Hedef", description: "Haftalık hedef 1 ile 300 arasında olmalıdır.", variant: "destructive" });
      return;
    }
    setWeeklyGoal(tempWeeklyGoal);
    setIsEditing(false);
    toast({ title: "Hedef Güncellendi!", description: "Yeni hedefin başarıyla kaydedildi.", variant: "success" });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Gezgin';
  const avatarUrl = profile?.avatar_url || user?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.id}`;
  
  const readStoriesCount = readStoryDetails.length;
  const weeklyProgress = weeklyGoal > 0 ? Math.min((readStoriesCount / weeklyGoal) * 100, 100) : 0;
  
  const recentActivities = useMemo(() => {
    if (!stories) return [];
    
    const readStories = stories
      .filter(s => s.is_read)
      .map(s => ({ ...s, type: 'read', date: new Date(s.read_at) }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 2);

    const savedStories = stories
      .filter(s => s.is_saved)
      .map(s => ({ ...s, type: 'saved', date: new Date(s.saved_at) }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 2);

    return [...readStories, ...savedStories]
      .sort((a, b) => b.date - a.date)
      .slice(0, 3);

  }, [stories]);

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 hidden h-full flex-col border-l bg-background s-desktop:flex z-40 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20 p-2" : "w-[340px] p-6"
    )}>
      <AnimatePresence>
        {isCollapsed ? (
          <motion.div 
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center space-y-4"
          >
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setCollapsed(false)}>
                      <PanelLeftOpen className="h-5 w-5"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" align="center" sideOffset={5}><p>Genişlet</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-10 w-10 cursor-pointer" onClick={() => navigate('/settings')}>
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center" sideOffset={5}><p>Profili Görüntüle</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <div className="w-full border-t my-2"></div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                      <Progress value={weeklyProgress} className="w-10 h-10 rounded-full" style={{ clipPath: 'circle(50% at 50% 50%)' }} />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{weeklyProgress.toFixed(0)}%</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" align="center" sideOffset={5}><p>Haftalık Hedef: {readStoriesCount}/{weeklyGoal}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="w-full border-t my-2"></div>
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}><Settings className="h-5 w-5"/></Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" align="center" sideOffset={5}><p>Ayarlar</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </motion.div>
        ) : (
        <motion.div 
          key="expanded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col h-full overflow-hidden"
        >
          <div>
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg text-foreground">Profilin</h2>
              </div>
              <div className="flex items-center">
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate('/settings')}><Settings className="mr-2 h-4 w-4"/>Profili Düzenle</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/help-center')}><HelpCircle className="mr-2 h-4 w-4"/>Yardım</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)}>
                  <PanelRightClose className="h-5 w-5"/>
                </Button>
              </div>
            </div>

            <div 
              className="flex flex-col items-center text-center mt-4"
            >
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                {canAccessPremiumFeatures && (
                  <motion.div 
                    initial={{scale:0}} 
                    animate={{scale:1}} 
                    transition={{type: 'spring', stiffness: 300, damping: 15, delay: 0.5}} 
                    className="absolute -bottom-1 -right-1 z-10 bg-background p-1 rounded-full shadow-md"
                  >
                    <Crown className="h-5 w-5 text-amber-400" fill="currentColor" />
                  </motion.div>
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">{getGreeting()}, {displayName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">Yolculuğuna devam et ve hedeflerine ulaş.</p>
            </div>
            
            <Card className="mt-6 p-4 bg-secondary/50">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="weekly-goal" className="font-semibold text-base flex items-center gap-2"><Goal className="h-4 w-4 text-primary"/> Haftalık Hedef</Label>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><ArrowLeft className="h-4 w-4"/></Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id="weekly-goal" type="number" value={tempWeeklyGoal} onChange={(e) => setTempWeeklyGoal(Math.min(300, Math.max(1, parseInt(e.target.value) || 1)))} className="h-10 text-center font-bold" />
                      <Button onClick={handleSaveGoal} size="icon"><Save className="h-4 w-4"/></Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="display"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary"/> Haftalık İlerleme</p>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Edit2 className="h-4 w-4"/></Button>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-muted-foreground mb-1">
                      <span>{readStoriesCount} / {weeklyGoal} Hikaye</span>
                      <span>{weeklyProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={weeklyProgress} className="h-2" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base text-foreground">Son Aktiviteler</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/activities')}>
                      Tümü
                      <ArrowRight className="ml-1 h-4 w-4"/>
                  </Button>
              </div>
              <div className="space-y-3">
                  {recentActivities.length > 0 ? recentActivities.map((activity) => (
                      <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer" onClick={() => navigate(`/story/${activity.slug}`)}>
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                              <img alt={activity.title} className="w-full h-full object-cover" src={activity.image_url || "https://images.unsplash.com/photo-1695313486156-469b82f59e07"} />
                          </div>
                          <div className="flex-1 overflow-hidden">
                              <p className="font-semibold text-sm truncate">{activity.title}</p>
                              <div className="flex items-center text-xs text-muted-foreground">
                                  <p>{activity.type === 'read' ? 'Okundu' : 'Kaydedildi'}</p>
                                  <span className="mx-1.5">·</span>
                                  <Badge variant="secondary" className={cn(`level-badge level-${activity.level}`)}>{activity.level.toUpperCase()}</Badge>
                              </div>
                          </div>
                      </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-4">Henüz bir aktivite yok.</p>}
              </div>
            </div>
          </div>
          <div className="mt-auto pt-6 text-center">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} HikayeGO</p>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default ProfileCard;