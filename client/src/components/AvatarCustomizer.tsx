import { CustomAvatar, GENDERS, EYE_STYLES, MOUTH_STYLES, HAIR_STYLES, SKIN_TONES } from "@shared/avatarSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CustomAvatarDisplay } from "./CustomAvatarDisplay";
import { User, Eye, Smile, Shirt, Palette } from "lucide-react";

interface AvatarCustomizerProps {
  avatar: CustomAvatar;
  onAvatarChange: (avatar: CustomAvatar) => void;
}

export function AvatarCustomizer({ avatar, onAvatarChange }: AvatarCustomizerProps) {
  const updateAvatar = (key: keyof CustomAvatar, value: any) => {
    onAvatarChange({ ...avatar, [key]: value });
  };

  const optionButtonClass = (isSelected: boolean) =>
    `px-4 py-2 rounded-lg border-2 transition-all font-medium ${
      isSelected 
        ? "border-primary bg-primary text-primary-foreground" 
        : "border-border bg-card hover:bg-accent"
    }`;

  const skinToneButtonClass = (isSelected: boolean) =>
    `h-10 w-10 rounded-full border-2 transition-all ${
      isSelected ? "ring-4 ring-primary ring-offset-2 scale-110" : "border-border hover:scale-105"
    }`;

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Customize Your Avatar
        </CardTitle>
        <CardDescription>Create your unique character</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex justify-center p-6 bg-muted/30 rounded-lg">
          <CustomAvatarDisplay avatar={avatar} size="lg" />
        </div>

        {/* Gender Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Gender
          </Label>
          <div className="flex gap-2">
            {GENDERS.map((gender) => (
              <Button
                key={gender}
                onClick={() => updateAvatar("gender", gender)}
                variant="outline"
                className={optionButtonClass(avatar.gender === gender)}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Skin Tone Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Skin Tone
          </Label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => updateAvatar("skinTone", tone)}
                className={skinToneButtonClass(avatar.skinTone === tone)}
                style={{ backgroundColor: tone }}
                title={tone}
                aria-label={`Skin tone ${tone}`}
              />
            ))}
          </div>
        </div>

        {/* Hair Style Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Hair Style
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {HAIR_STYLES.map((style) => (
              <Button
                key={style}
                onClick={() => updateAvatar("hairStyle", style)}
                variant="outline"
                size="sm"
                className={optionButtonClass(avatar.hairStyle === style)}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Hair Color Picker */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Hair Color
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={avatar.hairColor}
              onChange={(e) => updateAvatar("hairColor", e.target.value)}
              className="w-20 h-12 cursor-pointer"
            />
            <Input
              type="text"
              value={avatar.hairColor}
              onChange={(e) => updateAvatar("hairColor", e.target.value)}
              className="flex-1 font-mono uppercase"
              placeholder="#654321"
            />
          </div>
        </div>

        {/* Eyes Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Eyes
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {EYE_STYLES.map((eye) => (
              <Button
                key={eye}
                onClick={() => updateAvatar("eyes", eye)}
                variant="outline"
                size="sm"
                className={optionButtonClass(avatar.eyes === eye)}
              >
                {eye.charAt(0).toUpperCase() + eye.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Mouth Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Mouth
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {MOUTH_STYLES.map((mouth) => (
              <Button
                key={mouth}
                onClick={() => updateAvatar("mouth", mouth)}
                variant="outline"
                size="sm"
                className={optionButtonClass(avatar.mouth === mouth)}
              >
                {mouth.charAt(0).toUpperCase() + mouth.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Shirt/Dress Color Picker */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            {avatar.gender === "female" ? "Dress" : "Shirt"} Color
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={avatar.shirtColor}
              onChange={(e) => updateAvatar("shirtColor", e.target.value)}
              className="w-20 h-12 cursor-pointer"
            />
            <Input
              type="text"
              value={avatar.shirtColor}
              onChange={(e) => updateAvatar("shirtColor", e.target.value)}
              className="flex-1 font-mono uppercase"
              placeholder="#3B82F6"
            />
          </div>
        </div>

        {/* Pants Color Picker (only for males) */}
        {avatar.gender === "male" && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shirt className="h-4 w-4" />
              Pants Color
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={avatar.pantsColor}
                onChange={(e) => updateAvatar("pantsColor", e.target.value)}
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={avatar.pantsColor}
                onChange={(e) => updateAvatar("pantsColor", e.target.value)}
                className="flex-1 font-mono uppercase"
                placeholder="#1F2937"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
