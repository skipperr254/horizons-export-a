import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmptyState = React.memo(({ onResetFilters, isSearch = false }) => {

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="text-center py-16 flex flex-col items-center"
    >
      {isSearch ? (
        <SearchX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      ) : (
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      )}
      <h3 className="text-xl font-semibold mb-2">
        {isSearch ? "Arama Sonucu Bulunamadı" : "Hikaye Bulunamadı"}
      </h3>
      <p className="text-muted-foreground max-w-xs">
        {isSearch ? "Farklı bir anahtar kelime veya filtre ile aramayı deneyin." : "Görünüşe göre burada henüz hiç hikaye yok."}
      </p>
       <Button variant="outline" onClick={onResetFilters} className="mt-6">
        {isSearch ? "Filtreleri Temizle" : "Filtreleri Sıfırla"}
      </Button>
    </motion.div>
  );
});

export default EmptyState;