import { useState } from 'react';
import MpesaPaymentModal from '../MpesaPaymentModal';
import { Button } from '@/components/ui/button';

export default function MpesaPaymentModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setIsOpen(true)}>
        Open Payment Modal
      </Button>
      <MpesaPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        studentName="John Doe"
        amount={5000}
        onSuccess={() => console.log('Payment successful')}
      />
    </div>
  );
}
