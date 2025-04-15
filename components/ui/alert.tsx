import React, { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

export const Alert = ({ children, variant = "default", className }: AlertProps) => (
  <div className={`alert ${variant} ${className}`}>
    {children}
  </div>
);

export const AlertTitle = ({ children }: AlertProps) => (
  <h2 className="alert-title">
    {children}
  </h2>
);

export const AlertDescription = ({ children }: AlertProps) => (
  <p className="alert-description">
    {children}
  </p>
); 