/// <reference types="cypress" />

describe('Payment initiation service', () => {
  const api = Cypress.env('apiBaseUrl')
  it('Initiate payment with valid data', () => {
    cy.fixture("headersData").then((data) => {
      cy.request({
        method: 'POST', 
        url: api+'/pis/payment',
        headers: {
          "Content-Type": "application/json",
          "Redirect-URL": data.redirectUrl,
          "Client-Id": data.clientId,
          "Client-Secret": data.clientSecret,
        },
        body: {
          "amount": 0.01,
          "currencyCode": "EUR",
          "description": "test",
          "bankPaymentMethod": {
              "creditorName": "Padėk gatvės vaikams",
              "endToEndId": "1234567890",
              "informationStructured": {
                  "reference": "test"
              },
              "creditorAccount": {
                  "iban": "LT177300010119765165"
              }
          }
        }  
    })
    }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body.bankStatus).to.eq("STRD")
        expect(res.body.statusGroup).to.eq("started")
        expect(res.body.confirmLink).to.include(res.body.id)
      })
  })
})