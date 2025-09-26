import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";

// Import modular components
import StoryFormHeader from "./StoryFormHeader";
import StoryFormFields from "./StoryFormFields";
import ImageUpload from "./ImageUpload";
import StoryFormActions from "./StoryFormActions";
import { useStoryFormValidation } from "./StoryFormValidation";

const StoryForm = ({
  storyForm,
  setStoryForm,
  editingStory,
  setEditingStory,
  onStoryAdded,
  onStoryUpdated,
}) => {
  const { toast } = useToast();
  const { validateForm } = useStoryFormValidation();
  const [submitting, setSubmitting] = useState(false);

  // Function to find the nearest line break before or at a given position
  const findNearestLineBreak = (text, targetPosition) => {
    // If we're at or past the end, return the end
    if (targetPosition >= text.length) {
      return text.length;
    }

    // Look backwards from target position to find a line break (up to 100 chars back)
    for (let i = targetPosition; i >= Math.max(0, targetPosition - 100); i--) {
      if (text[i] === "\n") {
        return i + 1; // Return position after the line break
      }
    }

    // If no line break found backwards, look forward a bit (up to 100 chars forward)
    for (
      let i = targetPosition;
      i < Math.min(text.length, targetPosition + 100);
      i++
    ) {
      if (text[i] === "\n") {
        return i + 1; // Return position after the line break
      }
    }

    // If still no line break found, just use the target position
    return targetPosition;
  };

  // Function to split story content into sections based on character count (~1600 chars)
  const splitIntoSections = (text, benchmark = 1600) => {
    // Return single object if text is shorter than or equal to benchmark
    if (text.length <= benchmark) {
      return [{ content: text, section_order: 1 }];
    }

    const chunks = [];
    let remainingText = text;
    let sectionOrder = 1;
    const sentenceEndings = /[.!?]\s+/g; // Matches sentence boundaries
    const paragraphEndings = /\n\s*\n/g; // Matches paragraph breaks

    while (remainingText.length > benchmark) {
      // Find the last possible split point before or around the benchmark
      let splitPoint = benchmark;
      let lastSentenceEnd = -1;
      let lastParagraphEnd = -1;

      // Search for sentence and paragraph endings
      const sentenceMatches = [...remainingText.matchAll(sentenceEndings)];
      const paragraphMatches = [...remainingText.matchAll(paragraphEndings)];

      // Find the last sentence ending before benchmark
      for (const match of sentenceMatches) {
        if (match.index <= benchmark && match.index > lastSentenceEnd) {
          lastSentenceEnd = match.index + match[0].length;
        }
      }

      // Find the last paragraph ending before benchmark
      for (const match of paragraphMatches) {
        if (match.index <= benchmark && match.index > lastParagraphEnd) {
          lastParagraphEnd = match.index + match[0].length;
        }
      }

      // Choose the split point: prefer paragraph, then sentence, then benchmark
      if (lastParagraphEnd !== -1 && lastParagraphEnd <= benchmark) {
        splitPoint = lastParagraphEnd;
      } else if (lastSentenceEnd !== -1 && lastSentenceEnd <= benchmark) {
        splitPoint = lastSentenceEnd;
      }

      // Extract the chunk and add to array with section_order
      chunks.push({
        content: remainingText.substring(0, splitPoint).trim(),
        section_order: sectionOrder,
      });
      remainingText = remainingText.substring(splitPoint).trim();
      sectionOrder++;
    }

    // Add the remaining text as the last chunk with section_order
    if (remainingText.length > 0) {
      chunks.push({
        content: remainingText,
        section_order: sectionOrder,
      });
    }

    return chunks;
  };

  // Function to generate TTS audio for a text section
  const generateTTSAudio = async (text, sectionId, sectionOrder) => {
    try {
      console.log(
        `🎤 Requesting TTS for section ${sectionOrder} (${text.length} characters)...`
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");

      // Call your backend API endpoint for TTS generation
      const response = await fetch(
        "https://vjxkmufoztgzrnwaxswo.supabase.co/functions/v1/generate-audio",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text: text,
            sectionId: sectionId,
            sectionOrder: sectionOrder,
            languageCode: "tr-TR", // Turkish
            voiceName: "tr-TR-Standard-A", // Female voice
            audioEncoding: "MP3",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(
        `✅ TTS successful for section ${sectionOrder}: ${result.audioUrl}`
      );
      return result.audioUrl;
    } catch (error) {
      console.error(
        `❌ Error generating TTS for section ${sectionOrder}:`,
        error
      );
      return null;
    }
  };

  // Function to generate TTS for all sections (runs in background)
  const generateTTSForSections = async (sections) => {
    console.log(
      `🎵 Starting TTS generation for ${sections.length} sections...`
    );

    // Show toast about TTS generation starting
    toast({
      title: "Ses Dosyaları Oluşturuluyor",
      description: `${sections.length} bölüm için ses dosyaları arka planda hazırlanıyor...`,
    });

    let successCount = 0;
    let failCount = 0;

    // Process sections one by one to avoid overwhelming the TTS service
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      try {
        console.log(
          `📝 Processing section ${section.section_order} (${i + 1}/${
            sections.length
          })`
        );

        const audioUrl = await generateTTSAudio(
          section.content,
          section.id,
          section.section_order
        );

        if (audioUrl) {
          // Update the section with the generated audio URL
          const { error: updateError } = await supabase
            .from("story_sections")
            .update({
              audio_url: audioUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", section.id);

          if (updateError) {
            console.error(
              `❌ Error updating audio URL for section ${section.section_order}:`,
              updateError
            );
            failCount++;
          } else {
            console.log(
              `✅ Successfully generated and saved TTS for section ${section.section_order}`
            );
            successCount++;
          }
        } else {
          console.warn(
            `⚠️ Failed to generate TTS for section ${section.section_order}`
          );
          failCount++;
        }
      } catch (error) {
        console.error(
          `❌ Failed to process TTS for section ${section.section_order}:`,
          error
        );
        failCount++;
      }
    }

    console.log(
      `🏁 TTS generation completed: ${successCount} success, ${failCount} failed`
    );

    // Show completion toast
    if (successCount > 0) {
      toast({
        title: "Ses Dosyaları Hazır",
        description: `${successCount} bölüm için ses dosyaları başarıyla oluşturuldu${
          failCount > 0 ? ` (${failCount} başarısız)` : ""
        }.`,
      });
    } else {
      toast({
        title: "Ses Dosyası Hatası",
        description:
          "Hiçbir ses dosyası oluşturulamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  };

  // Function to save story sections to database and trigger TTS
  const saveStorySections = async (storyId, sections) => {
    console.log(
      `💾 Saving ${sections.length} sections for story ${storyId}...`
    );

    // Prepare sections for database insertion
    const sectionsToInsert = sections.map((section) => ({
      story_id: storyId,
      content: section.content,
      section_order: section.section_order,
      audio_url: null, // Will be updated when TTS completes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert sections into database
    const { data: savedSections, error } = await supabase
      .from("story_sections")
      .insert(sectionsToInsert)
      .select();

    if (error) {
      console.error("❌ Error saving story sections:", error);
      throw new Error(`Failed to save story sections: ${error.message}`);
    }

    console.log(`✅ Saved ${savedSections.length} sections to database`);

    // Start TTS generation in the background (don't await)
    setTimeout(() => {
      generateTTSForSections(savedSections).catch((error) => {
        console.error("❌ TTS generation process failed:", error);
        toast({
          title: "Ses Dosyası Hatası",
          description: "Ses dosyaları oluşturulurken bir sorun oluştu.",
          variant: "destructive",
        });
      });
    }, 1000); // Small delay to let the UI update first

    return savedSections;
  };

  // Function to update story sections (for editing)
  const updateStorySections = async (storyId, sections) => {
    console.log(`🔄 Updating sections for story ${storyId}...`);

    // First, delete existing sections for this story
    const { error: deleteError } = await supabase
      .from("story_sections")
      .delete()
      .eq("story_id", storyId);

    if (deleteError) {
      console.error("❌ Error deleting existing sections:", deleteError);
      throw new Error(
        `Failed to delete existing sections: ${deleteError.message}`
      );
    }

    console.log("✅ Deleted existing sections");

    // Then create new sections (this will trigger TTS generation)
    return await saveStorySections(storyId, sections);
  };

  const handleSubmit = async () => {
    if (!validateForm(storyForm)) {
      console.log("❌ Form validation failed");
      return;
    }

    setSubmitting(true);
    console.log("🚀 Starting story submission process...");

    try {
      const storyData = {
        title: storyForm.title.trim(),
        description: storyForm.description.trim(),
        level: storyForm.level,
        category: storyForm.category || "adventure",
        content: storyForm.content.trim(),
        read_time: storyForm.read_time.trim(),
        image_url: storyForm.image_url || null,
        is_featured: storyForm.is_featured,
      };

      // Split story content into sections based on character count
      console.log("📖 Processing story content for sectioning...");
      const sections = splitIntoSections(storyForm.content.trim());

      console.log(`📊 Story will be split into ${sections.length} sections:`);
      sections.forEach((section, index) => {
        console.log(
          `  Section ${index + 1}: ${section.content.length} characters`
        );
      });

      if (editingStory) {
        // Update existing story
        console.log(`🔄 Updating existing story ${editingStory.id}...`);

        const { data, error } = await supabase
          .from("stories")
          .update({
            ...storyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStory.id)
          .select()
          .single();

        if (error) {
          console.error("❌ Error updating story:", error);
          toast({
            title: "Hata",
            description: `Hikaye güncellenirken bir hata oluştu: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log("✅ Story updated successfully");

        // Update story sections and trigger TTS
        try {
          const updatedSections = await updateStorySections(
            editingStory.id,
            sections
          );
          console.log(
            `✅ Updated ${sections.length} sections for story ID: ${editingStory.id}`
          );

          onStoryUpdated(data);
          toast({
            title: "Hikaye Güncellendi",
            description: `Hikaye başarıyla güncellendi. ${sections.length} bölüm için ses dosyaları hazırlanıyor.`,
          });
        } catch (sectionError) {
          console.error("❌ Error updating story sections:", sectionError);
          toast({
            title: "Uyarı",
            description:
              "Hikaye güncellendi ancak bölümler kaydedilirken bir sorun oluştu.",
            variant: "destructive",
          });
        }
      } else {
        // Add new story
        console.log("✨ Creating new story...");

        const { data, error } = await supabase
          .from("stories")
          .insert([
            {
              ...storyData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("❌ Error adding story:", error);
          toast({
            title: "Hata",
            description: `Hikaye eklenirken bir hata oluştu: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log(`✅ Story created successfully with ID: ${data.id}`);

        // Save story sections and trigger TTS
        try {
          const savedSections = await saveStorySections(data.id, sections);
          console.log(
            `✅ Created ${savedSections.length} sections for story ID: ${data.id}`
          );

          onStoryAdded(data);
          toast({
            title: "Hikaye Oluşturuldu",
            description: `Hikaye başarıyla oluşturuldu! ${savedSections.length} bölüm için ses dosyaları hazırlanıyor.`,
          });
        } catch (sectionError) {
          console.error("❌ Error saving story sections:", sectionError);
          toast({
            title: "Uyarı",
            description:
              "Hikaye oluşturuldu ancak bölümler kaydedilirken bir sorun oluştu.",
            variant: "destructive",
          });
        }
      }

      // Reset form
      handleCancel();
    } catch (error) {
      console.error("❌ Error submitting story:", error);
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      console.log("🏁 Story submission process completed");
    }
  };

  const handleCancel = () => {
    console.log("🔄 Resetting story form");
    setEditingStory(null);
    setStoryForm({
      title: "",
      description: "",
      level: "a1",
      category: "adventure",
      content: "",
      read_time: "5 dk",
      image_url: "",
      is_featured: false,
    });
  };

  return (
    <Card>
      <StoryFormHeader editingStory={editingStory} />
      <CardContent className='space-y-4'>
        <StoryFormFields storyForm={storyForm} setStoryForm={setStoryForm} />
        <ImageUpload storyForm={storyForm} setStoryForm={setStoryForm} />
        <StoryFormActions
          editingStory={editingStory}
          submitting={submitting}
          uploading={false}
          storyForm={storyForm}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  );
};

export default StoryForm;