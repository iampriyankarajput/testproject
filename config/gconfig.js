/*******************************************************************************
 * ENV: All
 * Global Config
 ******************************************************************************/
'use strict';
const projectName = 'Huulke CRM';

module.exports = {
    monthsName: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    reportingManager: {
        fullName: 'Prem baboo',
        email: 'p.baboo@huulke.com'
    },
    deaultSuperAdmin: {
        email: 'developers@huulke.com',
        empCode: 'HKL-01',
        password: 'Password1',
        fullName: 'Prem Baboo',
        userType: 1,
        adminType: 1,
        modulesAndpermissions: [
            {
                key: 'dashboard',
                name: 'Dashboard',
                selected: false,
                permissions: {
                    'R': false,
                    'W': false,
                    'D': false,
                    'U': false
                }
            },
            {
                key: 'admin',
                name: 'Admins',
                selected: false,
                permissions: {
                    'R': false,
                    'W': false,
                    'D': false,
                    'U': false
                }
            },
            {
                key: 'contact',
                name: 'Contacts',
                selected: false,
                permissions: {
                    'R': false,
                    'W': false,
                    'D': false,
                    'U': false
                }
            },
            {
                key: 'purchase',
                name: 'Purchases',
                selected: false,
                permissions: {
                    'R': false,
                    'W': false,
                    'D': false,
                    'U': false
                }
            },
            {
                key: 'lead',
                name: 'Leads',
                selected: false,
                permissions: {
                    'R': false,
                    'W': false,
                    'D': false,
                    'U': false
                }
            }
        ]
    },
    emailOptions: {
        applyForLeave: {
            subject: ' has applied for leave ',
            template: 'applyForLeave'
        },
        approveLeave: {
            subject: 'Your leave has been approved',
            template: 'approveLeave'
        },
        contactNotification: {
            subject: ' has sent message on Huulke',
            template: 'contactNotification'
        }
    }
};
