'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the ENUM type for role
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Users_auth_provider" RENAME TO "enum_Users_auth_provider_old"`
    );
    
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Users_auth_provider" AS ENUM('local', 'google')`
    );
    
    await queryInterface.sequelize.query(
      `ALTER TABLE "users" ALTER COLUMN "auth_provider" TYPE "enum_Users_auth_provider" USING "auth_provider"::text::"enum_Users_auth_provider"`
    );
    
    await queryInterface.sequelize.query(
      `DROP TYPE "enum_Users_auth_provider_old"`
    );
    
    // Add the role column as a string first
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING,
      defaultValue: 'parent',
      allowNull: false
    });
    
    // Create the ENUM type
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_Users_role" AS ENUM('parent', 'child')`
    );
    
    // Convert the column to use the ENUM type
    await queryInterface.sequelize.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_Users_role" USING "role"::text::"enum_Users_role"`
    );
    
    // Add a comment to the column
    return queryInterface.sequelize.query(
      `COMMENT ON COLUMN "users"."role" IS 'Determines if the user is a parent or a child'`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the role column
    await queryInterface.removeColumn('users', 'role');
    
    // Drop the ENUM type
    return queryInterface.sequelize.query(
      `DROP TYPE "enum_Users_role"`
    );
  }
}; 