import React, { useEffect, useRef, useState } from 'react';
import type { GamingTable, BookingType, Customer } from '../../types';
import { startSession } from '../../api/sessions';
import { getCustomers } from '../../api/customers';
import { Modal } from '../../components/Modal';
import { DatePicker } from '../../components/DatePicker';

interface StartSessionModalProps {
  open: boolean;
  table: GamingTable | null;
  onClose: () => void;
  onStarted: () => void;
  /** If set, the table has an upcoming reservation at this time. New session must end by then. */
  reservedUntil?: Date | null;
}

export function StartSessionModal({ open, table, onClose, onStarted, reservedUntil }: StartSessionModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingType, setBookingType] = useState<BookingType>('pay_as_you_go');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [bookedDuration, setBookedDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Customer search dropdowns — separate state per field
  const [nameSuggestions, setNameSuggestions]   = useState<Customer[]>([]);
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [showNameDrop, setShowNameDrop]   = useState(false);
  const [showPhoneDrop, setShowPhoneDrop] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameRef  = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Close respective dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (nameRef.current  && !nameRef.current.contains(e.target as Node))  setShowNameDrop(false);
      if (phoneRef.current && !phoneRef.current.contains(e.target as Node)) setShowPhoneDrop(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Minutes remaining until the reservation time (null if no reservation constraint)
  const maxDurationMins = reservedUntil
    ? Math.max(0, Math.floor((reservedUntil.getTime() - Date.now()) / 60000))
    : null;

  useEffect(() => {
    if (!open) return;
    setCustomerName(''); setCustomerPhone('');
    setBookingType('pay_as_you_go');
    setScheduledDateTime(null); setBookedDuration('');
    setNameSuggestions([]); setPhoneSuggestions([]);
    setShowNameDrop(false); setShowPhoneDrop(false);
    setError('');
  }, [open]);

  function searchFor(val: string, setResults: (r: Customer[]) => void, setShow: (v: boolean) => void) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setResults([]); setShow(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await getCustomers({ search: val.trim(), limit: 6 });
        setResults(res.data);
        setShow(res.data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleNameChange(val: string) {
    setCustomerName(val);
    setShowPhoneDrop(false); // close phone dropdown when typing in name
    searchFor(val, setNameSuggestions, setShowNameDrop);
  }

  function handlePhoneChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(digits);
    setShowNameDrop(false); // close name dropdown when typing in phone
    searchFor(digits, setPhoneSuggestions, setShowPhoneDrop);
  }

  function pickCustomer(c: Customer) {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setNameSuggestions([]); setPhoneSuggestions([]);
    setShowNameDrop(false); setShowPhoneDrop(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!table) return;
    setError(''); setSubmitting(true);
    try {
      const payload: Parameters<typeof startSession>[0] = {
        table_id: table.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_type: bookingType,
      };
      if (bookingType === 'pre_booking' && scheduledDateTime) {
        payload.scheduled_start = scheduledDateTime.toISOString();
      }
      if ((bookingType === 'fixed_slot' || bookingType === 'pre_booking') && bookedDuration) {
        const dur = parseInt(bookedDuration, 10);
        // Enforce the reservation cap: session must end before the reserved slot
        if (maxDurationMins !== null && dur > maxDurationMins) {
          setError(`Session duration cannot exceed ${maxDurationMins} min — table is reserved at ${reservedUntil!.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`);
          setSubmitting(false);
          return;
        }
        payload.booked_duration = dur;
      }
      await startSession(payload);
      onStarted();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to start session');
    } finally {
      setSubmitting(false);
    }
  }

  const isPreBooking = bookingType === 'pre_booking';
  const needsDuration = bookingType === 'fixed_slot' || isPreBooking;

  return (
    <Modal open={open} onClose={onClose} title={`${isPreBooking ? 'Pre-Book' : 'Start Session'} — ${table?.name ?? ''}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Reservation constraint warning */}
        {reservedUntil && maxDurationMins !== null && (
          <div className="border border-amber-700/50 bg-amber-950/20 px-3 py-2.5 flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">⚠</span>
            <div>
              <p className="text-amber-400 text-xs font-mono-game tracking-wide font-bold">
                TABLE RESERVED AT {reservedUntil.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-amber-600 text-xs font-mono-game mt-0.5">
                New session must end by then — max {maxDurationMins} min available
              </p>
            </div>
          </div>
        )}

        {/* Customer */}
        <div className="border border-purple-900/30 p-4 flex flex-col gap-4">
          <p className="font-orbitron text-xs text-purple-600 tracking-widest uppercase">// Customer Info</p>

          {/* Name with search dropdown */}
          <div>
            <label className="game-label">Name</label>
            <div ref={nameRef} className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => { if (nameSuggestions.length > 0) setShowNameDrop(true); }}
                maxLength={150}
                placeholder="e.g. Rahul Kumar (optional)"
                className="game-input"
                autoComplete="off"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono-game">…</span>
              )}

              {showNameDrop && nameSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0f0f1e] border border-purple-700/50 shadow-2xl max-h-48 overflow-y-auto">
                  <div className="h-[1px] bg-gradient-to-r from-purple-600 to-cyan-500" />
                  {nameSuggestions.map((c) => (
                    <button key={c.id} type="button" onClick={() => pickCustomer(c)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-900/20 transition-colors border-b border-purple-900/10 last:border-0 text-left">
                      <span className="text-gray-200 text-xs font-semibold">{c.name}</span>
                      <span className="text-gray-600 font-mono-game text-xs ml-3">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-gray-700 text-xs font-mono-game mt-1">Type to search existing customers</p>
          </div>

          <div>
            <label className="game-label">Phone (10 digits)</label>
            <div ref={phoneRef} className="relative">
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onFocus={() => { if (phoneSuggestions.length > 0) setShowPhoneDrop(true); }}
                pattern="[6-9][0-9]{9}"
                placeholder="9876543210 (optional)"
                className="game-input"
                autoComplete="off"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono-game">…</span>
              )}

              {showPhoneDrop && phoneSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#0f0f1e] border border-purple-700/50 shadow-2xl max-h-48 overflow-y-auto">
                  <div className="h-[1px] bg-gradient-to-r from-purple-600 to-cyan-500" />
                  {phoneSuggestions.map((c) => (
                    <button key={c.id} type="button" onClick={() => pickCustomer(c)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-900/20 transition-colors border-b border-purple-900/10 last:border-0 text-left">
                      <span className="text-gray-600 font-mono-game text-xs">{c.phone}</span>
                      <span className="text-gray-200 text-xs font-semibold ml-3">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking type */}
        <div>
          <label className="game-label">Booking Type</label>
          <select value={bookingType} onChange={(e) => setBookingType(e.target.value as BookingType)} className="game-input">
            <option value="pay_as_you_go">Pay As You Go</option>
            <option value="fixed_slot">Fixed Slot</option>
            <option value="pre_booking">Pre-Booking (Reserve)</option>
            <option value="frame_wise">Frame Wise</option>
          </select>
          {isPreBooking && (
            <p className="text-blue-600 text-xs font-mono-game mt-1.5 tracking-wide">
              🔵 Table will be marked RESERVED. Clock starts when customer arrives.
            </p>
          )}
          {bookingType === 'frame_wise' && (
            <p className="text-emerald-700 text-xs font-mono-game mt-1.5 tracking-wide">
              🎱 Board occupied, billed per frame. Add player frames from the table card.
            </p>
          )}
        </div>

        {/* Scheduled arrival */}
        {isPreBooking && (
          <div className="border border-blue-900/30 p-4 flex flex-col gap-3">
            <p className="font-orbitron text-xs text-blue-600 tracking-widest uppercase">// Scheduled Arrival</p>
            <div>
              <label className="game-label">Date &amp; Time</label>
              <DatePicker
                value={scheduledDateTime}
                onChange={setScheduledDateTime}
                minDate={new Date()}
                showTimeSelect
                timeIntervals={15}
                placeholder="Pick date & time…"
                required
              />
            </div>
            {scheduledDateTime && (
              <div className="bg-blue-950/20 border border-blue-900/30 px-3 py-2">
                <p className="text-blue-400 text-xs font-mono-game tracking-wide">
                  ◷ {scheduledDateTime.toLocaleString(undefined, {
                    weekday: 'short', day: 'numeric', month: 'short',
                    year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Duration */}
        {needsDuration && (
          <div className="flex flex-col gap-2">
            <label className="game-label">Booked Duration</label>
            {maxDurationMins !== null && (
              <p className="text-amber-600 text-xs font-mono-game tracking-wide">
                Max allowed: {maxDurationMins} min (reservation at {reservedUntil!.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})
              </p>
            )}
            <div className="flex gap-2">
              {[60, 120, 180].map((mins) => {
                const exceedsCap = maxDurationMins !== null && mins > maxDurationMins;
                return (
                  <button key={mins} type="button"
                    onClick={() => !exceedsCap && setBookedDuration(String(mins))}
                    disabled={exceedsCap}
                    className={`flex-1 py-2 text-xs font-bold tracking-widest uppercase border transition-all ${
                      exceedsCap
                        ? 'border-gray-800/30 text-gray-700 cursor-not-allowed opacity-40'
                        : bookedDuration === String(mins)
                        ? 'bg-purple-600/30 border-purple-500/70 text-purple-200'
                        : 'border-gray-700/50 text-gray-500 hover:border-purple-700/50 hover:text-purple-400'
                    }`}>
                    {mins / 60}hr
                  </button>
                );
              })}
            </div>
            <input type="number" min="5" step="5"
              max={maxDurationMins ?? undefined}
              value={bookedDuration}
              onChange={(e) => setBookedDuration(e.target.value)}
              required className="game-input" placeholder={maxDurationMins !== null ? `max ${maxDurationMins} min` : 'or enter custom minutes (e.g. 90, 45)'} />
            {bookedDuration && (() => {
              const dur = parseInt(bookedDuration);
              const overCap = maxDurationMins !== null && dur > maxDurationMins;
              return (
                <p className={`text-xs font-mono-game tracking-wide ${overCap ? 'text-red-500' : 'text-purple-700'}`}>
                  {overCap
                    ? `⚠ Exceeds max allowed (${maxDurationMins} min)`
                    : `◷ ${Math.floor(dur / 60) > 0 ? `${Math.floor(dur / 60)}h ` : ''}${dur % 60 > 0 ? `${dur % 60}m` : ''}`
                  }
                </p>
              );
            })()}
          </div>
        )}

        {error && (
          <div className="border border-red-800/40 bg-red-950/20 px-3 py-2 flex items-center gap-2">
            <span className="text-red-400">⚠</span>
            <p className="text-red-400 text-xs font-mono-game tracking-wide">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting}
          className={`w-full py-2.5 px-4 font-orbitron text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed border ${
            isPreBooking
              ? 'bg-blue-600/20 border-blue-500/60 text-blue-300 hover:bg-blue-600/40 hover:text-white'
              : 'bg-purple-600/20 border-purple-500/60 text-purple-300 hover:bg-purple-600/40 hover:text-white'
          }`}>
          {submitting ? '// Processing…' : isPreBooking ? '🔵 Reserve Table' : '▶ Start Session'}
        </button>
      </form>
    </Modal>
  );
}
