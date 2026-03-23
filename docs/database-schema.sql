-- Logical schema for writerapp (MySQL)

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL,
  owner_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE contents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  section_number INT NOT NULL,
  text LONGTEXT NOT NULL,
  last_updated DATETIME NOT NULL,
  CONSTRAINT fk_contents_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT uk_project_section UNIQUE (project_id, section_number)
);

CREATE TABLE collaborators (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(20) NOT NULL,
  CONSTRAINT fk_collaborators_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_collaborators_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uk_project_user UNIQUE (project_id, user_id)
);

CREATE TABLE content_versions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  content_id BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  section_number INT NOT NULL,
  text LONGTEXT NOT NULL,
  edited_by VARCHAR(50) NOT NULL,
  edited_at DATETIME NOT NULL,
  CONSTRAINT fk_versions_content FOREIGN KEY (content_id) REFERENCES contents(id)
);
