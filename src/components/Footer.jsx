
import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NumbersGuru. All rights reserved.
      </div>
    </footer>
  );
}
