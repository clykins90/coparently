'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Create a new ENUM type with the updated values
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_conversations_conversation_type_new" AS ENUM('linked_partner', 'linked_child');
    `);

    // Step 2: Update the column to use the new ENUM type
    await queryInterface.sequelize.query(`
      ALTER TABLE conversations 
      ALTER COLUMN conversation_type TYPE "enum_conversations_conversation_type_new" 
      USING (
        CASE 
          WHEN conversation_type::text = 'standard' THEN 'linked_partner'::enum_conversations_conversation_type_new
          WHEN conversation_type::text = 'parent_child' THEN 'linked_child'::enum_conversations_conversation_type_new
          ELSE conversation_type::text::enum_conversations_conversation_type_new
        END
      );
    `);

    // Step 3: Drop the old ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_conversations_conversation_type";
    `);

    // Step 4: Rename the new ENUM type to the original name
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_conversations_conversation_type_new" RENAME TO "enum_conversations_conversation_type";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes if needed
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_conversations_conversation_type_old" AS ENUM('linked_partner', 'standard', 'parent_child');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE conversations 
      ALTER COLUMN conversation_type TYPE "enum_conversations_conversation_type_old" 
      USING (
        CASE
          WHEN conversation_type::text = 'linked_child' THEN 'parent_child'::enum_conversations_conversation_type_old
          ELSE conversation_type::text::enum_conversations_conversation_type_old
        END
      );
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_conversations_conversation_type";
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_conversations_conversation_type_old" RENAME TO "enum_conversations_conversation_type";
    `);
  }
}; 