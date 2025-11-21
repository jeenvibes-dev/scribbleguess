import { CustomAvatar } from "@shared/avatarSchema";

interface CustomAvatarDisplayProps {
  avatar: CustomAvatar;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CustomAvatarDisplay({ 
  avatar, 
  size = "md", 
  className = "" 
}: CustomAvatarDisplayProps) {
  const sizeMap = {
    sm: 48,
    md: 64,
    lg: 80,
  };
  
  const svgSize = sizeMap[size];
  const shirtColor = avatar.shirtColor;
  const pantsColor = avatar.pantsColor;
  const skinTone = avatar.skinTone;
  const hairColor = avatar.hairColor;
  
  // Eye paths based on style
  const renderEyes = () => {
    const eyeY = 30;
    const leftEyeX = 25;
    const rightEyeX = 45;
    
    switch (avatar.eyes) {
      case "happy":
        return (
          <g>
            <path d={`M ${leftEyeX-5},${eyeY} Q ${leftEyeX},${eyeY-3} ${leftEyeX+5},${eyeY}`} 
                  stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${rightEyeX-5},${eyeY} Q ${rightEyeX},${eyeY-3} ${rightEyeX+5},${eyeY}`} 
                  stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        );
      case "wink":
        return (
          <g>
            <circle cx={leftEyeX} cy={eyeY} r="3" fill="#000"/>
            <path d={`M ${rightEyeX-5},${eyeY} Q ${rightEyeX},${eyeY-3} ${rightEyeX+5},${eyeY}`} 
                  stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        );
      case "closed":
        return (
          <g>
            <line x1={leftEyeX-5} y1={eyeY} x2={leftEyeX+5} y2={eyeY} 
                  stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1={rightEyeX-5} y1={eyeY} x2={rightEyeX+5} y2={eyeY} 
                  stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
          </g>
        );
      case "surprised":
        return (
          <g>
            <circle cx={leftEyeX} cy={eyeY} r="4" fill="#FFF" stroke="#000" strokeWidth="2"/>
            <circle cx={leftEyeX} cy={eyeY} r="2" fill="#000"/>
            <circle cx={rightEyeX} cy={eyeY} r="4" fill="#FFF" stroke="#000" strokeWidth="2"/>
            <circle cx={rightEyeX} cy={eyeY} r="2" fill="#000"/>
          </g>
        );
      case "cool":
        return (
          <g>
            <rect x={leftEyeX-6} y={eyeY-3} width="12" height="6" fill="#000" rx="2"/>
            <rect x={rightEyeX-6} y={eyeY-3} width="12" height="6" fill="#000" rx="2"/>
            <line x1={leftEyeX+6} y1={eyeY} x2={rightEyeX-6} y2={eyeY} 
                  stroke="#000" strokeWidth="2"/>
          </g>
        );
      default: // normal
        return (
          <g>
            <circle cx={leftEyeX} cy={eyeY} r="3" fill="#000"/>
            <circle cx={rightEyeX} cy={eyeY} r="3" fill="#000"/>
          </g>
        );
    }
  };
  
  // Mouth paths based on style
  const renderMouth = () => {
    const mouthY = 45;
    const mouthX = 35;
    
    switch (avatar.mouth) {
      case "grin":
        return (
          <path d={`M ${mouthX-8},${mouthY} Q ${mouthX},${mouthY+6} ${mouthX+8},${mouthY}`} 
                stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
        );
      case "neutral":
        return (
          <line x1={mouthX-6} y1={mouthY} x2={mouthX+6} y2={mouthY} 
                stroke="#000" strokeWidth="2" strokeLinecap="round"/>
        );
      case "open":
        return (
          <ellipse cx={mouthX} cy={mouthY+2} rx="5" ry="6" fill="#000"/>
        );
      case "tongue":
        return (
          <g>
            <path d={`M ${mouthX-8},${mouthY} Q ${mouthX},${mouthY+6} ${mouthX+8},${mouthY}`} 
                  stroke="#000" strokeWidth="2" fill="none"/>
            <ellipse cx={mouthX} cy={mouthY+4} rx="3" ry="4" fill="#FF6B9D"/>
          </g>
        );
      case "mustache":
        return (
          <g>
            <path d={`M ${mouthX-8},${mouthY} Q ${mouthX},${mouthY+4} ${mouthX+8},${mouthY}`} 
                  stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d={`M ${mouthX-8},${mouthY-5} Q ${mouthX-4},${mouthY-3} ${mouthX},${mouthY-5}`} 
                  stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d={`M ${mouthX},${mouthY-5} Q ${mouthX+4},${mouthY-3} ${mouthX+8},${mouthY-5}`} 
                  stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        );
      default: // smile
        return (
          <path d={`M ${mouthX-8},${mouthY} Q ${mouthX},${mouthY+4} ${mouthX+8},${mouthY}`} 
                stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round"/>
        );
    }
  };
  
  // Hair based on gender and style
  const renderHair = () => {
    const baseHair = (
      <g>
        {avatar.hairStyle === "short" && (
          <ellipse cx="35" cy="12" rx="20" ry="12" fill={hairColor}/>
        )}
        {avatar.hairStyle === "long" && (
          <>
            <ellipse cx="35" cy="15" rx="22" ry="18" fill={hairColor}/>
            <path d="M 15,20 Q 12,35 15,50" fill={hairColor} stroke={hairColor} strokeWidth="8"/>
            <path d="M 55,20 Q 58,35 55,50" fill={hairColor} stroke={hairColor} strokeWidth="8"/>
          </>
        )}
        {avatar.hairStyle === "curly" && (
          <>
            <ellipse cx="35" cy="12" rx="22" ry="14" fill={hairColor}/>
            <circle cx="20" cy="18" r="6" fill={hairColor}/>
            <circle cx="50" cy="18" r="6" fill={hairColor}/>
            <circle cx="25" cy="10" r="5" fill={hairColor}/>
            <circle cx="45" cy="10" r="5" fill={hairColor}/>
          </>
        )}
        {avatar.hairStyle === "bun" && (
          <>
            <ellipse cx="35" cy="12" rx="18" ry="10" fill={hairColor}/>
            <circle cx="35" cy="5" r="8" fill={hairColor}/>
          </>
        )}
        {avatar.hairStyle === "ponytail" && (
          <>
            <ellipse cx="35" cy="12" rx="20" ry="12" fill={hairColor}/>
            <ellipse cx="52" cy="20" rx="8" ry="18" fill={hairColor}/>
          </>
        )}
        {avatar.hairStyle === "spiky" && (
          <>
            <polygon points="20,15 18,5 22,12" fill={hairColor}/>
            <polygon points="28,12 26,2 30,10" fill={hairColor}/>
            <polygon points="35,10 33,0 37,8" fill={hairColor}/>
            <polygon points="42,12 40,2 44,10" fill={hairColor}/>
            <polygon points="50,15 48,5 52,12" fill={hairColor}/>
            <ellipse cx="35" cy="15" rx="20" ry="10" fill={hairColor}/>
          </>
        )}
      </g>
    );
    return baseHair;
  };
  
  return (
    <div className={`inline-block ${className}`}>
      <svg 
        width={svgSize} 
        height={svgSize} 
        viewBox="0 0 70 100"
        className="drop-shadow-md"
      >
        {/* Body */}
        <g>
          {/* Clothing based on gender */}
          {avatar.gender === "female" ? (
            <>
              {/* Top/Shirt */}
              <rect x="20" y="50" width="30" height="20" fill={shirtColor} rx="4"/>
              {/* Skirt */}
              <path 
                d="M 20,70 L 18,85 L 52,85 L 50,70 Z" 
                fill={pantsColor} 
                stroke="#000" 
                strokeWidth="1.5"
              />
              {/* Legs */}
              <rect x="24" y="85" width="8" height="15" fill={skinTone}/>
              <rect x="38" y="85" width="8" height="15" fill={skinTone}/>
            </>
          ) : (
            <>
              {/* Shirt */}
              <rect x="20" y="50" width="30" height="25" fill={shirtColor} rx="4"/>
              {/* Pants */}
              <rect x="24" y="75" width="8" height="25" fill={pantsColor} rx="2"/>
              <rect x="38" y="75" width="8" height="25" fill={pantsColor} rx="2"/>
            </>
          )}
          
          {/* Neck */}
          <rect x="30" y="48" width="10" height="8" fill={skinTone}/>
          
          {/* Head */}
          <circle cx="35" cy="30" r="20" fill={skinTone} stroke="#000" strokeWidth="2"/>
          
          {/* Hair */}
          {renderHair()}
          
          {/* Eyes */}
          {renderEyes()}
          
          {/* Mouth */}
          {renderMouth()}
        </g>
      </svg>
    </div>
  );
}
