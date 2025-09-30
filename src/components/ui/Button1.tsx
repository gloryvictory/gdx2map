import { Home } from 'lucide-react';
import type * as React from 'react';
import { Button } from './button';

const Button1: React.FC = () => {
  return (
    <Button variant="default" className="w-10 h-10">
      <Home className="w-4 h-4" />
    </Button>
  );
};

export default Button1;
