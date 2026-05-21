const db = require('../models');
const { success, error } = require('../utils/response');

// GET /api/skills
exports.getAll = async (req, res) => {
  try {
    const { departmentId, category } = req.query;
    const where = { isActive: true };
    if (departmentId) where.departmentId = departmentId;
    if (category) where.category = category;
    const skills = await db.Skill.findAll({
      where,
      include: [{ model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']],
    });
    return success(res, skills, 'Skills retrieved.');
  } catch (err) {
    console.error('Get skills error:', err);
    return error(res, 'Failed to fetch skills.', 500);
  }
};

// POST /api/skills
exports.create = async (req, res) => {
  try {
    const skill = await db.Skill.create(req.body);
    return success(res, skill, 'Skill created.', 201);
  } catch (err) {
    console.error('Create skill error:', err);
    return error(res, err.message || 'Failed to create skill.', 500);
  }
};

// PUT /api/skills/:id
exports.update = async (req, res) => {
  try {
    const skill = await db.Skill.findByPk(req.params.id);
    if (!skill) return error(res, 'Skill not found.', 404);
    await skill.update(req.body);
    return success(res, skill, 'Skill updated.');
  } catch (err) {
    console.error('Update skill error:', err);
    return error(res, 'Failed to update skill.', 500);
  }
};

// DELETE /api/skills/:id
exports.remove = async (req, res) => {
  try {
    const skill = await db.Skill.findByPk(req.params.id);
    if (!skill) return error(res, 'Skill not found.', 404);
    await skill.update({ isActive: false });
    return success(res, null, 'Skill deactivated.');
  } catch (err) {
    console.error('Delete skill error:', err);
    return error(res, 'Failed to delete skill.', 500);
  }
};

// GET /api/skills/matrix
// Returns: { skills: [...], employees: [...], matrix: [{userId, skillId, level}] }
exports.getMatrix = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const skillWhere = { isActive: true };
    if (departmentId) skillWhere.departmentId = departmentId;

    const skills = await db.Skill.findAll({
      where: skillWhere,
      include: [{ model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']],
    });

    const userInclude = [{
      model: db.DepartmentUser,
      as: 'departmentAssignments',
      include: [{ model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    }];
    const userWhere = { isActive: true };
    const employees = await db.User.findAll({
      where: userWhere,
      attributes: ['id', 'username', 'fullName', 'email', 'role'],
      include: userInclude,
      order: [['fullName', 'ASC']],
    });

    // Optionally filter employees by department
    let filteredEmployees = employees;
    if (departmentId) {
      filteredEmployees = employees.filter((e) =>
        e.departmentAssignments?.some((da) => String(da.departmentId) === String(departmentId)),
      );
    }

    const matrix = await db.EmployeeSkill.findAll({
      where: {
        userId: filteredEmployees.map((e) => e.id),
        skillId: skills.map((s) => s.id),
      },
      attributes: ['id', 'userId', 'skillId', 'level', 'certifiedDate', 'expiresAt', 'notes'],
    });

    return success(res, { skills, employees: filteredEmployees, matrix }, 'Skill matrix retrieved.');
  } catch (err) {
    console.error('Get skill matrix error:', err);
    return error(res, 'Failed to fetch skill matrix.', 500);
  }
};

// PUT /api/skills/matrix
// Body: { entries: [{userId, skillId, level, notes?}] }
exports.updateMatrix = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries)) return error(res, 'entries array required.', 400);

    const results = [];
    for (const entry of entries) {
      const { userId, skillId, level, notes } = entry;
      if (!userId || !skillId || !level) continue;
      const [record] = await db.EmployeeSkill.findOrCreate({
        where: { userId, skillId },
        defaults: { level, notes, updatedBy: req.userId },
      });
      await record.update({ level, notes, updatedBy: req.userId });
      results.push(record);
    }
    return success(res, results, `${results.length} skill records updated.`);
  } catch (err) {
    console.error('Update matrix error:', err);
    return error(res, 'Failed to update skill matrix.', 500);
  }
};

// PUT /api/skills/matrix/:userId/:skillId
exports.updateCell = async (req, res) => {
  try {
    const { userId, skillId } = req.params;
    const { level, notes, certifiedDate, expiresAt } = req.body;
    const [record] = await db.EmployeeSkill.findOrCreate({
      where: { userId, skillId },
      defaults: { level, notes, certifiedDate, expiresAt, updatedBy: req.userId },
    });
    await record.update({ level, notes, certifiedDate, expiresAt, updatedBy: req.userId });
    return success(res, record, 'Skill level updated.');
  } catch (err) {
    console.error('Update cell error:', err);
    return error(res, 'Failed to update skill level.', 500);
  }
};
