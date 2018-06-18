const fs = require('fs');
const path = require('path');
const Model = require('./model.js');
const Authors = require('./authors.js');
const Posts = require('./posts.js');
const slug = require('./helpers/slug');

/**
 * Author Model - used for operations connected with author management
 */
class Author extends Model {
    /**
     * Creates an instance of the model
     *
     * @param appInstance {object} - instance of the application
     * @param authorData {object} - object with author data
     */
    constructor(appInstance, authorData, storeMode = true) {
        super(appInstance, authorData);
        this.id = parseInt(authorData.id, 10);
        this.authorsData = new Authors(appInstance, authorData);
        this.postsData = new Posts(appInstance, authorData);
        this.storeMode = storeMode;

        if(authorData.name || authorData.name === '') {
            this.name = authorData.name;
            this.username = authorData.username;
            this.config = authorData.config;
            this.additionalData = authorData.additionalData;
            this.prepareAuthorName();
        }
    }

    /**
     * Saves new/existing author data
     *
     * @returns {object} - object with created/edited author data
     */
    save() {
        if(this.name === '') {
            return {
                status: false,
                message: 'author-empty-name'
            };
        }

        if(this.username === '' || slug(this.username) === '') {
            this.username = slug(this.name);
        }

        if(!this.isAuthorNameUnique()) {
            return {
                status: false,
                message: 'author-duplicate-name'
            };
        }

        if(!this.isAuthorUsernameUnique()) {
            return {
                status: false,
                message: 'author-duplicate-username'
            };
        }

        if(this.id !== 0) {
            return this.updateAuthor();
        }

        return this.addAuthor();
    }

    /**
     * Stores new author in the DB
     *
     * @returns {{status: boolean, message: string, authors: *}}
     */
    addAuthor() {
        let sqlQuery = this.db.prepare(`INSERT INTO authors VALUES(null, ?, ?, "", ?, ?)`);
        sqlQuery.run([
            this.name,
            slug(this.username),
            this.config,
            this.additionalData
        ]);

        if(this.storeMode) {
            this.storeDB();
        }

        sqlQuery.free();

        return {
            status: true,
            message: 'author-added',
            postsAuthors: this.postsData.loadAuthorsXRef(),
            authors: this.authorsData.load()
        };
    }

    /**
     * Updates existing author in the DB
     *
     * @returns {{status: boolean, message: string}}
     */
    updateAuthor() {
        let sqlQuery = this.db.prepare(`UPDATE authors
                        SET
                            name = ?,
                            username = ?,
                            password = "",
                            config = ?,
                            additional_data = ?
                        WHERE
                            id = ?`);
        sqlQuery.run([
            this.name,
            slug(this.username),
            this.config,
            this.additionalData,
            this.id
        ]);

        if(this.storeMode) {
            this.storeDB();
        }

        sqlQuery.free();

        return {
            status: true,
            message: 'author-updated',
            postsAuthors: this.postsData.loadAuthorsXRef(),
            authors: this.authorsData.load()
        };
    }

    /**
     * Creates author name without leading/ending spaces
     */
    prepareAuthorName() {
        if(typeof this.name == 'undefined') {
            this.name = '';
        }
        // Remove leading and ending spaces (trim it)
        // it will also exclude case when author name contains only
        // whitespaces
        this.name = this.name.replace(/^\s+/, '').replace(/\s+$/, '');
    }

    /**
     * Check if the author name is unique
     *
     * @returns {boolean}
     */
    isAuthorNameUnique() {
        let sqlQuery = `SELECT * FROM authors WHERE name LIKE "${this.escape(this.name)}" AND id != ${this.id}`;
        let results = this.db.exec(sqlQuery);

        if(!results[0] || !results[0].values.length) {
            return true;
        }

        results = results[0].values;

        if(results.indexOf(this.name) > -1) {
            return false;
        }

        return true;
    }

    /**
     * Checks if author username (slug) is unique
     *
     * @returns {boolean}
     */
    isAuthorUsernameUnique() {
        let sqlQuery = `SELECT username FROM authors WHERE id != ${this.id}`;
        let results = this.db.exec(sqlQuery);

        if(!results[0] || !results[0].values.length) {
            return true;
        }

        // Check every author and its slug
        for(let authorName of results[0].values) {
            if(slug(this.username) === slug(authorName)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Removes current author
     *
     * @returns {{status: boolean, message: string}}
     */
    delete() {
        if(this.id === 1) {
            return {
                status: false,
                message: 'cannot-delete-main-author'
            };
        }

        let authorsSqlQuery = `DELETE FROM authors WHERE id=${this.id}`;
        let postsSqlQuery = `UPDATE posts SET authors = "1" WHERE authors = "${this.id}"`;
        this.db.run(authorsSqlQuery);
        this.db.run(postsSqlQuery);

        if(this.storeMode) {
            this.storeDB();
        }

        return {
            status: true,
            message: 'author-deleted',
            posts: this.postsData.load(),
            postsAuthors: this.postsData.loadAuthorsXRef(),
            authors: this.authorsData.load()
        };
    }
}

module.exports = Author;
