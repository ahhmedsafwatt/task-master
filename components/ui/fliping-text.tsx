'use client'

import React from 'react'
import { motion } from 'motion/react'
import { useHoverEffect } from '@/hooks/use-hover-effect'

interface HoverScaleTextProps {
  initialText: string
  className?: string
}

export const FlipingText = ({
  initialText,
  className,
}: HoverScaleTextProps) => {
  const { isHovered, hoverProps } = useHoverEffect()

  // Memoize variants to prevent recreation on each render
  const letterVariants = React.useMemo(
    () => ({
      initial: { y: 0, opacity: 1 },
      hover: { y: -20, opacity: 0 },
    }),
    [],
  )

  const hoverLetterVariants = React.useMemo(
    () => ({
      initial: { y: 20, opacity: 0 },
      hover: { y: 0, opacity: 1 },
    }),
    [],
  )

  // Split text only once and memoize
  const letters = React.useMemo(() => initialText.split(''), [initialText])

  return (
    <div className={`relative ${className}`} {...hoverProps}>
      <div className="relative overflow-clip">
        {/* Initial text */}
        <div className="relative">
          {letters.map((letter, index) => (
            <motion.span
              key={`initial-${index}`}
              className="inline-block"
              variants={letterVariants}
              initial="initial"
              animate={isHovered ? 'hover' : 'initial'}
              transition={{
                duration: 0.6, // Slightly faster animation
                ease: [0.625, 0.05, 0, 1],
                delay: index * 0.008, // Reduced delay for smoother effect
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </div>

        {/* Hover text */}
        <div className="absolute left-0 top-0">
          {letters.map((letter, index) => (
            <motion.span
              key={`hover-${index}`}
              className="inline-block"
              variants={hoverLetterVariants}
              initial="initial"
              animate={isHovered ? 'hover' : 'initial'}
              transition={{
                duration: 0.6, // Slightly faster animation
                ease: [0.625, 0.05, 0, 1],
                delay: index * 0.008, // Reduced delay for smoother effect
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}
