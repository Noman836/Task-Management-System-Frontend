export const validateTaskData = (data, isUpdate = false) => {
  const errors = [];
  
  // Title validation
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  } else {
    const trimmedTitle = data.title.trim();
    if (trimmedTitle.length < 3) {
      errors.push('Title must be at least 3 characters long');
    } else if (trimmedTitle.length > 255) {
      errors.push('Title must be less than 255 characters');
    }
    // Check for invalid characters (allow letters, numbers, spaces, and basic punctuation)
    if (!/^[a-zA-Z0-9\s\-_.,!?()[\]{}:;'"\\@#$%&*+=<>~`]+$/.test(trimmedTitle))
      errors.push('Title contains invalid characters');
  }

  // Due date validation
  if (!data.due_date) {
    errors.push('Due date is required');
  } else {
    const dueDate = new Date(data.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.push('Due date must be a valid date');
    } else if (dueDate < new Date().setHours(0, 0, 0, 0)) {
      errors.push('Due date cannot be in the past');
    } else if (dueDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      errors.push('Due date cannot be more than 1 year in the future');
    }
  }

  // Priority validation
  if (!data.priority || typeof data.priority !== 'string') {
    errors.push('Priority is required and must be a string');
  } else {
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(data.priority)) {
      errors.push('Priority must be Low, Medium, or High');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else {
      const trimmedDescription = data.description.trim();
      if (trimmedDescription.length > 0 && trimmedDescription.length < 5) {
        errors.push('Description must be at least 5 characters long if provided');
      } else if (trimmedDescription.length > 1000) {
        errors.push('Description must be less than 1000 characters');
      }
      // Check for potentially malicious content
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(trimmedDescription)) {
        errors.push('Description contains invalid content');
      }
    }
  }

  // Completed validation (for updates)
  if (isUpdate && data.completed !== undefined) {
    // Convert various types to boolean
    if (typeof data.completed === 'string') {
      const lowerCompleted = data.completed.toLowerCase().trim();
      if (lowerCompleted === 'true' || lowerCompleted === '1') {
        data.completed = true;
      } else if (lowerCompleted === 'false' || lowerCompleted === '0') {
        data.completed = false;
      } else {
        errors.push('Completed must be true, false, 1, or 0');
      }
    } else if (typeof data.completed === 'number') {
      if (data.completed === 1) {
        data.completed = true;
      } else if (data.completed === 0) {
        data.completed = false;
      } else {
        errors.push('Completed must be 1 or 0 when provided as a number');
      }
    } else {
      data.completed = Boolean(data.completed);
    }
    
    if (typeof data.completed !== 'boolean') {
      errors.push('Completed must be a boolean value');
    }
  }

  // Additional validation for create operations
  if (!isUpdate) {
    // Ensure no extra fields are being sent
    const allowedFields = ['title', 'description', 'due_date', 'priority'];
    const extraFields = Object.keys(data).filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
      errors.push(`Invalid fields provided: ${extraFields.join(', ')}`);
    }
  }

  // General data validation
  if (typeof data !== 'object' || data === null) {
    errors.push('Task data must be a valid object');
  }

  return errors;
};

export const getFieldError = (errors, fieldName) => {
  const fieldErrors = {
    title: errors.filter(error => 
      error.toLowerCase().includes('title')
    ),
    due_date: errors.filter(error => 
      error.toLowerCase().includes('due date')
    ),
    priority: errors.filter(error => 
      error.toLowerCase().includes('priority')
    ),
    description: errors.filter(error => 
      error.toLowerCase().includes('description')
    ),
    completed: errors.filter(error => 
      error.toLowerCase().includes('completed')
    )
  };

  return fieldErrors[fieldName] || [];
}
