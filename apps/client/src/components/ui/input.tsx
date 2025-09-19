import React, { forwardRef, InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }


