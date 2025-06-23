import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentTrackingPage from '../pages/admin/PaymentTrackingPage';
import { AuthContext } from '../context/AuthContext';

// Basit fetch mocku
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve([]),
}));

describe('PaymentTrackingPage', () => {
  const renderWithAuth = () => {
    return render(
      <AuthContext.Provider value={{ authToken: 'dummy-token' }}>
        <PaymentTrackingPage />
      </AuthContext.Provider>
    );
  };

  it('başlık render ediyor', () => {
    renderWithAuth();
    expect(screen.getByText(/Ödeme Takip/i)).toBeInTheDocument();
  });

  it('Uygula butonuna tıklayınca fetch çağrılır', async () => {
    renderWithAuth();
    const applyBtn = screen.getByRole('button', { name: /Uygula/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
