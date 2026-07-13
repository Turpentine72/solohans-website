import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orders as ordersApi } from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import Receipt from '../component/Receipt';

export default function ReceiptPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isStaffContext = searchParams.get('staff') === '1';
  const { settings } = useSettings();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getReceipt(id)
      .then(setOrder)
      .catch(() => setError("This receipt link is invalid or the order couldn't be found."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <Helmet><title>Receipt – Solohans</title></Helmet>
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading receipt…</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <Receipt order={order} business={settings} trackPrint={isStaffContext} />
        )}
      </div>
    </>
  );
}