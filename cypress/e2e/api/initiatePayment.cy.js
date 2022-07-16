/// <reference types='cypress' />

describe('Initiate payment tests', () => {
  const api = Cypress.env('apiBaseUrl')
  const reqBody = {
    'amount': 0.01,
    'currencyCode': 'EUR',
    'description': 'test',
    'bankPaymentMethod': {
        'creditorName': 'Padėk gatvės vaikams',
        'endToEndId': '1234567890',
        'informationStructured': {
            'reference': 'test'
        },
        'creditorAccount': {
            'iban': 'LT177300010119765165'
        }
    }
  }

  // Input valid data, expect status 200, ensure that the response includes
  // expected bankStatus and statusGroup values.
  it('Initiate payment with valid data', () => {
    cy.fixture('headersData').then((data) => {
      cy.request({
        method: 'POST', 
        url: api+'/pis/payment',
        headers: {
          'Content-Type': 'application/json',
          'Redirect-URL': data.redirectUrl,
          'Client-Id': data.clientId,
          'Client-Secret': data.clientSecret,
        },
        body: reqBody
      })
    }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body.bankStatus).to.eq('STRD')
        expect(res.body.statusGroup).to.eq('started')
        expect(res.body.confirmLink).to.include(res.body.id)
      })
  })

  // Input invalid client ID, expect the request to fail (should return 401).
  it('Initiate payment with invalid client ID', () => {
    cy.fixture('headersData').then((data) => {
      cy.request({
        method: 'POST', 
        url: api+'/pis/payment',
        headers: {
          'Content-Type': 'application/json',
          'Redirect-URL': data.redirectUrl,
          'Client-Id': data.clientId.split('').reverse().join(''),
          'Client-Secret': data.clientSecret,
        },
        body: reqBody,
        failOnStatusCode: false
      })
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // Send request with an empty Client-Secret value, expect the request to fail (should return 401).
  it('Initiate payment with a missing client secret value', () => {
    cy.fixture('headersData').then((data) => {
      cy.request({
        method: 'POST', 
        url: api+'/pis/payment',
        headers: {
          'Content-Type': 'application/json',
          'Redirect-URL': data.redirectUrl,
          'Client-Id': data.clientId,
          'Client-Secret': '',
        },
        body: reqBody,
        failOnStatusCode: false
      })
    }).then((res) => {
      expect(res.status).to.eq(401)
    })
  })

  // Ensure that the redirect url validator works. Send a requst with
  // invalid redirect url. Expect the request to result in 400.
  it('Initiate payment with an invalid redirect url value', () => {
    cy.fixture('headersData').then((data) => {
      cy.request({
        method: 'POST', 
        url: api+'/pis/payment',
        headers: {
          'Content-Type': 'application/json',
          'Redirect-URL': 'invalid url',
          'Client-Id': data.clientId,
          'Client-Secret': data.clientSecret,
        },
        body: reqBody,
        failOnStatusCode: false
      })
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.error.name).to.eq('InvalidRedirect')
    })
  })

  // Ensure that all requests with value <= 0 result in status 400.
  it('Initiate payment with invalid amount(i.e. less than 0.01)', () => {
    cy.fixture('headersData').then((data) => {
      cy.request({
        method: 'POST', 
        url: api+'/pis/payment',
        headers: {
          'Content-Type': 'application/json',
          'Redirect-URL': data.redirectUrl,
          'Client-Id': data.clientId,
          'Client-Secret': data.clientSecret,
        },
        body: {
          ...reqBody,
          'amount': 0
        },
        failOnStatusCode: false
      })
    }).then((res) => {
        expect(res.status).to.eq(400)
        expect(res.body.data).to.eq('"amount" must be greater than or equal to 0.01')
      })
  })

    // Ensure that the payment amount format is correct, as defined in documentation.
    // It shouldn't accept any other separators, other than a decimal '.' separator.
    // The amount can have max 2 decimal digits.
    it('Payment cannot be initiated if amount value is of wrong foramt', () => {
      cy.fixture('headersData').then((data) => {
        cy.request({
          method: 'POST', 
          url: api+'/pis/payment',
          headers: {
            'Content-Type': 'application/json',
            'Redirect-URL': data.redirectUrl,
            'Client-Id': data.clientId,
            'Client-Secret': data.clientSecret,
          },
          body: {
            ...reqBody,
            'amount': '1,230'
          },
          failOnStatusCode: false
        })
      }).then((res) => {
          expect(res.status).to.eq(400)
          expect(res.body.data).to.eq('"amount" must be a number')
        })
      cy.fixture('headersData').then((data) => {
        cy.request({
          method: 'POST', 
          url: api+'/pis/payment',
          headers: {
            'Content-Type': 'application/json',
            'Redirect-URL': data.redirectUrl,
            'Client-Id': data.clientId,
            'Client-Secret': data.clientSecret,
          },
          body: {
            ...reqBody,
            'amount': '0.011'
          },
          failOnStatusCode: false
        })
      }).then((res) => {
          expect(res.status).to.eq(400)
          expect(res.body.data).to.eq('"amount" contains an invalid value')
        })
    })

    // If payment initiation is successful, the payment details should
    // be saved in the DB and can be retrieved with the payment ID
    it('Successfully initiated payments are saved in DB and can be accessed with a payment ID', () => {
      cy.fixture('headersData').then((data) => {
        cy.request({
          method: 'POST', 
          url: api+'/pis/payment',
          headers: {
            'Content-Type': 'application/json',
            'Redirect-URL': data.redirectUrl,
            'Client-Id': data.clientId,
            'Client-Secret': data.clientSecret,
            'PSU-Device-ID': data.psuDeviceId
          },
          body: reqBody
        }).then((res) => {
          cy.request({
            method: 'GET',
            url: api+'/pis/payment/'+res.body.id,
            headers: {
              'Content-Type': 'application/json',
              'Client-Id': data.clientId,
              'Client-Secret': data.clientSecret,
            },
          }).then((res2) => {
            expect(res2.status).to.eq(200)
            expect(res2.body.id).to.eq(res.body.id)
            expect(res2.body.amount).to.eq('0.01')
            expect(res2.body.bankPaymentMethod.endToEndId).to.eq('1234567890')
          })
        })
      })
    })
})