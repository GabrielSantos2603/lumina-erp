import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Maximize2, Download, Trash2 } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ImageFile {
  id: string;
  file?: File;
  url: string;
  name: string;
  size?: number;
  uploaded?: boolean;
}

interface ImageUploadGalleryProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export function ImageUploadGallery({
  images,
  onImagesChange,
  maxImages = 20,
  maxSizeMB = 10,
}: ImageUploadGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const maxSize = maxSizeMB * 1024 * 1024;

      const newImages: ImageFile[] = acceptedFiles
        .filter((file) => {
          if (file.size > maxSize) {
            alert(`${file.name} excede o tamanho máximo de ${maxSizeMB}MB`);
            return false;
          }
          return true;
        })
        .slice(0, maxImages - images.length)
        .map((file) => ({
          id: `temp-${Date.now()}-${Math.random()}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          uploaded: false,
        }));

      onImagesChange([...images, ...newImages]);
    },
    [images, maxImages, maxSizeMB, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: images.length >= maxImages,
  });

  const handleRemoveImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url && !imageToRemove.uploaded) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onImagesChange(images.filter((img) => img.id !== id));
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDownloadImage = async (image: ImageFile) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar imagem:", error);
      alert("Erro ao baixar imagem");
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Solte as imagens aqui..."
                  : "Arraste imagens ou clique para selecionar"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF até {maxSizeMB}MB • Máximo {maxImages} imagens
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className="relative group overflow-hidden aspect-square hover:shadow-lg transition-all"
            >
              {/* Image */}
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:text-primary hover:bg-white/20"
                  onClick={() => handleOpenLightbox(index)}
                  title="Visualizar em tela cheia"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:text-primary hover:bg-white/20"
                  onClick={() => handleDownloadImage(image)}
                  title="Baixar imagem"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:text-destructive hover:bg-white/20"
                  onClick={() => handleRemoveImage(image.id)}
                  title="Remover imagem"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Image info badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white truncate">{image.name}</p>
                {image.size && (
                  <p className="text-xs text-white/70">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>

              {/* Upload status indicator */}
              {!image.uploaded && (
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                    Pendente
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>
              {images.length} de {maxImages} imagens
            </span>
          </div>
          {images.length >= maxImages && (
            <span className="text-yellow-600 dark:text-yellow-500">
              Limite alcançado
            </span>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={images.map((img) => ({ src: img.url }))}
      />
    </div>
  );
}
