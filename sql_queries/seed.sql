INSERT INTO banks (name) VALUES ('City Bank'), ('DBBL'), ('Brac Bank'), ('Sonali Bank');


INSERT INTO card_networks (name) VALUES ('Visa'), ('Mastercard'), ('Amex');

INSERT INTO mock_bank_accounts (bank_id, account_holder_name, phone_number, bank_pin, current_balance)
VALUES 
    -- City Bank
    (1, 'agent7', '01341234567', '1234', 400000.00),
    (1, 'fahim', '01813639241', '1234', 15000.00),
    -- DBBL
    (2, 'FAHIM', '01411111112', '1234', 50000.00),--this is merchant account
    (2, 'User D', '01811000004', '1234', 25000.00),
    -- Brac Bank
    (3, 'User E', '01911000005', '1234', 2000.00),
    (3, 'User F', '01911000006', '1234', 30000.00),
    -- Sonali Bank
    (4, 'Wahidul Hoque', '01311104750', '1234', 10000.00),
    (4, 'User H', '01511000008', '1234', 50000.00);



INSERT INTO mock_card_accounts (network_id, card_number, expiry_date, cvv, current_balance)
VALUES 
    -- Visa
    (1, '4422-1111-2222-3333', '12/28', '123', 4000.00),
    (1, '4422-4444-5555-6666', '12/28', '456', 20000.00),
    -- Mastercard
    (2, '5511-1111-2222-3333', '06/27', '789', 1500.00),
    (2, '5511-4444-5555-6666', '06/27', '000', 35000.00),
    -- Amex
    (3, '3782-1111-2222-3333', '01/29', '111', 10000.00),
    (3, '3782-4444-5555-6666', '01/29', '222', 75000.00);