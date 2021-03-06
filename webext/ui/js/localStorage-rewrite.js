/*
 *  Copyright (C) 2016 Savoir-faire Linux Inc.
 *
 *  Author: Seva Ivanov <seva.ivanov@savoirfairelinux.com>
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA.
 */

/* Documentation:   Storage.md -> wiki
 * Diagram:         Image -> extra/diagrams/localStorage.png
 */

// Constructor

var RingLocalStorage = function()
{
    // Generates a singleton
    this.userId = this.uuid();
};

// Exposure to Node.js tests/unit-tests.js
if (!(typeof module === 'undefined'))
{
    module.exports.RingLocalStorage = RingLocalStorage;
}

// USER table

RingLocalStorage.prototype.createUser = function(
    firstname, lastname, accounts=null, contacts=null)
{
    var users = JSON.parse(localStorage.getItem('users'));
    users = !users ? {} : users;

    if (users[this.userId])
    {
        throw new Error('User already created');
    }
    
    var user = {
        'ID':           this.userId,
        'FIRSTNAME':    firstname,
        'LASTNAME':     lastname,
        'ACCOUNTS':     !accounts ? {} : accounts,
        'CONTACTS':     !contacts ? [] : contacts
    };
    users[this.userId] = user;

    localStorage.setItem('users', JSON.stringify(users));
    return user;
};

RingLocalStorage.prototype.getUser = function()
{
    var users = JSON.parse(localStorage.getItem('users'));

    if (!users[this.userId])
    {
        throw new Error("User haven't been created");
    }

    return users[this.userId];
};

RingLocalStorage.prototype.updateUser = function(
    firstname=null, lastname=null, accounts=null, contacts=null)
{
    var user = this.getUser(),
        users = JSON.parse(localStorage.getItem('users'));

    user = {
        'ID':       this.userId,
        'FISTNAME': !firstname ? user.FIRSTNAME : firstname,
        'LASTNAME': !lastname ? user.LASTNAME : lastname,
        'ACCOUNTS': !accounts ? user.ACCOUNTS : accounts,
        'CONTACTS': !contacts ? user.CONTACTS : contacts
    };
    users[user.ID] = user;

    localStorage.setItem('users', JSON.stringify(users));
    return user;
};

RingLocalStorage.prototype.getUserContacts = function()
{
    var users = JSON.parse(localStorage.getItem('users'));
    
    if (!users[this.userId])
    {
        throw new Error("User haven't been created");
    }
    
    return users[this.userId].CONTACTS;
}

RingLocalStorage.prototype.userContact = function(contactId)
{
    var contacts = this.getUserContacts(),
        hasContact = false;

    for (key in contacts)
    {
        if (key == contactId)
        {
            hasContact = true;
        }
    }

    return hasContact;
}

// deleteUser: You delete the plugin, see the wiki: storage section.

RingLocalStorage.prototype.createContact = function(
    firstname, lastname)
{
    // Create it
    var contactId = this.uuid(),
        contact = {
            'ID':           contactId,
            'FIRSTNAME':    firstname,
            'LASTNAME':     lastname,
            'ACCOUNTS':     {}
        },
        contacts = JSON.parse(localStorage.getItem('contacts')),
        users = JSON.parse(localStorage.getItem('users'));

    contacts = !contacts ? {} : contacts;
    
    if (!users[this.userId])
    {
        throw new Error("User haven't been created");
    }


    // Add it to contacts
    contacts[contactId] = contact;
    localStorage.setItem('contacts', JSON.stringify(contacts));

    // Add to user contacts
    users[this.userId].CONTACTS.push(contact.ID);
    localStorage.setItem('users', JSON.stringify(users));

    return contactId;
};

RingLocalStorage.prototype.contactExists = function(contactId)
{
    var contacts = JSON.parse(localStorage.getItem('contacts'));
    return !!contacts[contactId];
}

RingLocalStorage.prototype.getContact = function(contactId)
{
    var contacts = JSON.parse(localStorage.getItem('contacts'));

    if (!contacts[contactId])
    {
        throw new Error('Contact with ID ' + contactId + " does't exists.");
    }

    return contacts[contactId];
}

RingLocalStorage.prototype.getContacts = function()
{
    return JSON.parse(localStorage.getItem('contacts'));
}

RingLocalStorage.prototype.updateContact = function(
    contactId, firstname=null, lastname=null)
{
    var contacts = JSON.parse(localStorage.getItem('contacts')),
        contact = this.getContact(contactId);

    contact.FIRSTNAME = !firstname ? contact.FIRSTNAME : firstname;
    contact.LASTNAME = !lastname ? contact.LASTNAME: lastname;
    
    contacts[contactId] = contact;
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    return contact;
}

RingLocalStorage.prototype.addContactAccount = function(
    contactId, accountId, settings)
{
    var contacts = JSON.parse(localStorage.getItem('contacts')),
        contact = this.getContact(contactId),
        newAccount = true;

    for (key in contact.ACCOUNTS)
    {
        if (key == accountId)
        {
            newAccount = false;
        }
    }

    if (!newAccount)
    {
        throw new Error('Account with ID ' + accountId + ' exists');
    }

    contact.ACCOUNTS[accountId] = settings;

    contacts[contact.ID] = contact;
    localStorage.setItem('contacts', JSON.stringify(contacts));

    return contact;
}

RingLocalStorage.prototype.contactAccountExists = function(
    contactId, accountId)
{
    var contacts = JSON.parse(localStorage.getItem('contacts')),
        contact = this.getContact(contactId),
        accountExists = false;

    for (key in contact.ACCOUNTS)
    {
        if (key == accountId)
        {
            accountExists = true;
        }
    }

    return accountExists;
}

RingLocalStorage.prototype.deleteContactAccount = function(
    contactId, accountId)
{
    var contacts = JSON.parse(localStorage.getItem('contacts')),
        contact = this.getContact(contactId);
    
    if (!this.contactAccountExists(contactId, accountId))
    {
        throw new Error('Account with ID ' + accountId + " doesn't exists");
    }

    delete contact.ACCOUNTS[accountId];

    contacts[contact.ID] = contact;
    localStorage.setItem('contacts', JSON.stringify(contacts));

    return true;
}

RingLocalStorage.prototype.deleteContact = function(contactId)
{
    var contacts = JSON.parse(localStorage.getItem('contacts')),
        users = JSON.parse(localStorage.getItem('users'));
    
    var contact = this.getContact(contactId);
    
    delete contacts[contactId];
    delete users[this.userId].CONTACTS[contactId];

    localStorage.setItem('contacts', JSON.stringify(contacts));
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
}

// Notifications

RingLocalStorage.prototype.incrementContactsNotifications = function()
{
    var total = parseInt(localStorage.getItem('contactsNotifications'));
    localStorage.setItem('contactsNotifications', total += 1);
}

RingLocalStorage.prototype.contactsNotifications = function()
{
    return localStorage.getItem('contactsNotifications');
}

RingLocalStorage.prototype.substractContactsNotifications = function(value)
{
    var total = localStorage.getItem('contactsNotifications');
    localStorage.setItem('contactsNotifications', total - value);
    return total - value;
}

RingLocalStorage.prototype.clearContactsNotifications = function()
{
    localStorage.setItem('contactsNotifications', 0);
}

// Chat History

// TODO rewrite to new schema

RingLocalStorage.prototype.accountContactHistory = function(accountId, contactId)
{
    var data = JSON.parse(localStorage.getItem('ring.cx')),
        contact = data[accountId]['contacts'][contactId];

    if (!contact)
    {
        return null;
    }
    else if (contact['history'])
    {
        return contact['history'];
    }
}

RingLocalStorage.prototype.addAccountContactHistory = function(
    accountId, contactId, messageStatus, message)
{
    if (!message)
    {
        throw new Error('No messageStatus provided');
    }

    if (!(messageStatus == 'sent' || messageStatus == 'received'))
    {
        throw new Error("The messageStatus is not in the list " +
            "('sent', 'received')");
    }

    var data = JSON.parse(localStorage.getItem('ring.cx')),
        contact = data[accountId]['contacts'][contactId],
        history = contact['history'];

    if (!history)
    {
        history = []
    }

    history.push({
        datetime: Date(),
        message: message,
        messageStatus: messageStatus
    });

    data[accountId]['contacts'][contactId]['history'] = history;

    localStorage.setItem('ring.cx', JSON.stringify(data));
    return true;
}

RingLocalStorage.prototype.deleteContactHistory = function(accountId, contactId)
{
    var data = JSON.parse(localStorage.getItem('ring.cx')),
        contact = data[accountId]['contacts'][contactId];

    if (!contact)
    {
        throw new Error("Contact with id '" + contactId + "' doesn't exists");
    }
    else if (!contact['history'])
    {
        throw new Error("Contact with id '" + contactId + "' has no history");
    }

    delete data[accountId]['contacts'][contactId]['history'];
    localStorage.setItem('ring.cx', JSON.stringify(data));
    return true
}

// Extra

// Adapted RFC 4122
RingLocalStorage.prototype.uuid = function()
{
    var array = [];
    var hexDigits = "0123456789abcdef";

    for (var i = 0; i < 10; i++)
    {
        array[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }

    return array.join("");
}

