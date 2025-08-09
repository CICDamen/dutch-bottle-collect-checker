import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SupermarketData, IncidentReport } from '@/types/supermarket';

interface IncidentReportDialogProps {
  supermarket: SupermarketData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: IncidentReport) => void;
}

const IncidentReportDialog: React.FC<IncidentReportDialogProps> = ({
  supermarket,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reportType, setReportType] = useState<IncidentReport['type']>('machine_broken');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supermarket) return;

    onSubmit({
      supermarketId: supermarket.id,
      type: reportType,
      description,
      reporterName,
    });

    // Reset form
    setDescription('');
    setReporterName('');
    setReportType('machine_broken');
    onClose();
  };

  if (!supermarket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Incident Melden</DialogTitle>
          <DialogDescription>
            Meld een probleem met de flesseninzameling bij {supermarket.chain} in {supermarket.city}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Type incident</Label>
            <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as IncidentReport['type'])}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="machine_broken" id="machine_broken" />
                <Label htmlFor="machine_broken">Automaat defect</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="store_closed" id="store_closed" />
                <Label htmlFor="store_closed">Winkel gesloten</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_bottles_accepted" id="no_bottles_accepted" />
                <Label htmlFor="no_bottles_accepted">Flessen worden niet geaccepteerd</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Anders</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              placeholder="Beschrijf het probleem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterName">Uw naam (optioneel)</Label>
            <Input
              id="reporterName"
              placeholder="Naam"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit">
              Incident Melden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentReportDialog;